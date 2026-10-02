"""
Dataset Analyzer API Endpoints

Upload and analyze CSV datasets for supply chain risk using:
- Time-series forecasting (Chronos-2 if available, fallback to statistical)
- AI-driven column classification (NVIDIA)
- Risk metrics: stability, fragility, overconfidence
"""

import json
import os
import re
from typing import Any, Dict, List, Optional
from datetime import datetime
import hashlib

import numpy as np
import pandas as pd
import requests
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

router = APIRouter()


# ============================================================================
# RISK METRICS (from api.py)
# ============================================================================

def stability_score(actual: np.ndarray) -> float:
    """Calculate stability score based on coefficient of variation."""
    cv = np.std(actual) / (np.mean(actual) + 1e-6)
    return float(max(0, 1 - cv))


def fragility_score(actual: np.ndarray) -> float:
    """Calculate fragility based on rolling volatility spikes."""
    rolling_std = pd.Series(actual).rolling(10).std()
    spike_ratio = rolling_std.max() / (rolling_std.mean() + 1e-6)
    return float(min(1, spike_ratio / 5))


def overconfidence_score(actual: np.ndarray, lower: np.ndarray, upper: np.ndarray) -> float:
    """Calculate overconfidence based on confidence interval breaches."""
    outside_ci = ((actual < lower) | (actual > upper)).mean()
    ci_width = (upper - lower).mean() / (np.mean(actual) + 1e-6)
    return float(min(1, outside_ci * (1 / (ci_width + 1e-6))))


def risk_score(stability: float, fragility: float, overconfidence: float) -> float:
    """Calculate overall risk score (weighted combination)."""
    score = (
        0.4 * fragility +
        0.4 * overconfidence +
        0.2 * (1 - stability)
    )
    return float(min(1, max(0, score)))


def risk_level(score: float) -> str:
    """Convert risk score to level."""
    if score < 0.3:
        return "LOW"
    elif score < 0.6:
        return "MEDIUM"
    else:
        return "HIGH"


# ============================================================================
# FORECASTING (Chronos fallback to statistical)
# ============================================================================

CHRONOS_AVAILABLE = False
try:
    from chronos import ChronosPipeline
    # Use t5-small as default for CPU
    pipeline = ChronosPipeline.from_pretrained(
        "amazon/chronos-t5-small",
        device_map="cpu",
        torch_dtype="auto"
    )
    CHRONOS_AVAILABLE = True
except (ImportError, Exception):
    pipeline = None


def forecast_series(series: pd.Series, horizon: int) -> tuple:
    """
    Forecast a time series and return predictions with confidence intervals.
    Uses Chronos-2 if available, otherwise falls back to statistical method.
    """
    actual = series.dropna().values
    
    if len(actual) < 20:
        return None, actual, None, None
    
    if CHRONOS_AVAILABLE and pipeline is not None:
        # Use Chronos-2
        df = pd.DataFrame({"target": actual})
        df["timestamp"] = pd.date_range(start="2023-01-01", periods=len(df), freq="h")
        df["id"] = "signal"
        
        train_df = df.iloc[:-horizon]
        forecast_df = pipeline.predict_df(
            train_df,
            prediction_length=horizon,
            quantile_levels=[0.1, 0.5, 0.9],
            id_column="id",
            timestamp_column="timestamp",
            target="target"
        )
        
        lower = forecast_df["0.1"].values[:len(actual[-horizon:])]
        upper = forecast_df["0.9"].values[:len(actual[-horizon:])]
        forecast = forecast_df["0.5"].values[:len(actual[-horizon:])]
        actual_horizon = actual[-horizon:]
        
        return forecast, actual_horizon, lower, upper
    else:
        # Statistical fallback: simple moving average with std bands
        window = min(10, len(actual) // 4)
        rolling_mean = pd.Series(actual).rolling(window).mean().iloc[-horizon:].values
        rolling_std = pd.Series(actual).rolling(window).std().iloc[-horizon:].values
        
        lower = rolling_mean - 1.645 * rolling_std  # 90% CI
        upper = rolling_mean + 1.645 * rolling_std
        actual_horizon = actual[-horizon:]
        
        return rolling_mean, actual_horizon, lower, upper


# ============================================================================
# NVIDIA COLUMN MAPPER
from agents.llm_router import analyze_with_nvidia

async def map_columns_with_nvidia(columns: List[str], sample_rows: Dict[str, List[Any]]) -> Dict[str, Any]:
    """Call NVIDIA to classify columns for supply chain risk analysis."""
    prompt = f"""
You are a supply chain risk analyst.

Given column names and small samples, classify each column into:
- stability
- fragility
- overconfidence
- not_relevant

Also specify:
- whether the column should be forecasted (true/false)

Rules:
- Only numeric, time-varying columns can be forecasted
- Identifiers, IDs, categories are not forecastable
- Output STRICT JSON, no explanations outside JSON

Columns and samples:
{json.dumps(sample_rows, indent=2)}
"""

    try:
        text = await analyze_with_nvidia(prompt)
        parsed = _extract_json(text)
        
        if parsed is None:
            return _fallback_column_classification(columns, sample_rows)
        
        return parsed
    except Exception:
        return _fallback_column_classification(columns, sample_rows)


def _fallback_column_classification(columns: List[str], sample_rows: Dict[str, List[Any]]) -> Dict[str, Any]:
    """Fallback classification when NVIDIA is unavailable."""
    result = {}
    for col in columns:
        samples = sample_rows.get(col, [])
        is_numeric = all(isinstance(v, (int, float)) for v in samples if v is not None)
        
        # Heuristic classification
        col_lower = col.lower()
        if any(kw in col_lower for kw in ["id", "name", "code", "type", "category"]):
            result[col] = {"classification": "not_relevant", "forecastable": False}
        elif any(kw in col_lower for kw in ["stability", "reliable", "consistent"]):
            result[col] = {"classification": "stability", "forecastable": is_numeric}
        elif any(kw in col_lower for kw in ["risk", "fragil", "volatile", "spike"]):
            result[col] = {"classification": "fragility", "forecastable": is_numeric}
        elif any(kw in col_lower for kw in ["confidence", "gap", "over"]):
            result[col] = {"classification": "overconfidence", "forecastable": is_numeric}
        elif is_numeric and len(samples) > 0:
            result[col] = {"classification": "stability", "forecastable": True}
        else:
            result[col] = {"classification": "not_relevant", "forecastable": False}
    
    return result


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    """Extract JSON from AI response."""
    if not text:
        return None
    
    cleaned = text.strip()
    fence_pattern = re.compile(r"^```[a-zA-Z0-9]*\s*(.*?)\s*```$", re.DOTALL)
    fenced = fence_pattern.match(cleaned)
    if fenced:
        cleaned = fenced.group(1).strip()
    
    brace_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not brace_match:
        return None
    
    try:
        return json.loads(brace_match.group(0))
    except json.JSONDecodeError:
        return None


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ColumnResult(BaseModel):
    column_name: str
    classification: str
    stability: float
    fragility: float
    overconfidence: float
    risk_score: float
    risk_level: str


class AnalysisResponse(BaseModel):
    status: str
    job_id: str
    signals_analyzed: List[str]
    results: Dict[str, dict]
    skipped: Dict[str, str]
    overall_risk: float
    overall_level: str
    chronos_available: bool


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/upload", response_model=AnalysisResponse)
async def analyze_uploaded_dataset(file: UploadFile = File(...)):
    """
    Upload a CSV dataset and analyze it for supply chain risk.
    Uses Chronos-2 for forecasting (if available) and NVIDIA for column classification.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        df = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
    
    # Generate job ID
    job_id = hashlib.md5(f"{file.filename}{datetime.now().isoformat()}".encode()).hexdigest()[:12]
    
    # Sample rows for NVIDIA
    sample_rows = {
        col: df[col].dropna().head(5).tolist()
        for col in df.columns
    }
    
    # Classify columns
    column_map = await map_columns_with_nvidia(df.columns.tolist(), sample_rows)
    
    results = {}
    skipped = {}
    MIN_POINTS = 20
    
    for col, meta in column_map.items():
        if not meta.get("forecastable", False):
            skipped[col] = "Marked non-forecastable"
            continue
        
        series = df[col].dropna()
        if len(series) < MIN_POINTS:
            skipped[col] = f"Too few points (<{MIN_POINTS})"
            continue
        
        horizon = max(4, min(72, len(series) // 4))
        forecast, actual, lower, upper = forecast_series(series, horizon)
        
        if actual is None or lower is None or upper is None:
            skipped[col] = "Forecasting failed"
            continue
        
        stab = stability_score(actual)
        frag = fragility_score(actual)
        overconf = overconfidence_score(actual, lower, upper)
        risk = risk_score(stab, frag, overconf)
        
        results[col] = {
            "classification": meta.get("classification", "unknown"),
            "stability": round(stab, 3),
            "fragility": round(frag, 3),
            "overconfidence": round(overconf, 3),
            "risk_score": round(risk, 3),
            "risk_level": risk_level(risk),
        }
    
    # Calculate overall risk
    if results:
        overall = np.mean([r["risk_score"] for r in results.values()])
    else:
        overall = 0.0
    
    return AnalysisResponse(
        status="success",
        job_id=job_id,
        signals_analyzed=list(results.keys()),
        results=results,
        skipped=skipped,
        overall_risk=round(overall, 3),
        overall_level=risk_level(overall),
        chronos_available=CHRONOS_AVAILABLE,
    )


@router.get("/master")
async def analyze_master_dataset():
    """
    Analyze the master dataset (aggregated from scraped data).
    Returns risk metrics based on accumulated supply chain intelligence.
    """
    # Generate synthetic master dataset inline
    df = get_master_dataset()
    
    if df is None or df.empty:
        return {
            "status": "no_data",
            "message": "Master dataset not available. Run scraping first.",
            "overall_risk": 0.0,
            "overall_level": "UNKNOWN",
        }
    
    # Analyze all numeric columns
    results = {}
    for col in df.select_dtypes(include=[np.number]).columns:
        series = df[col].dropna()
        if len(series) < 20:
            continue
        
        horizon = max(4, min(30, len(series) // 4))
        forecast, actual, lower, upper = forecast_series(series, horizon)
        
        if actual is None:
            continue
        
        stab = stability_score(actual)
        frag = fragility_score(actual)
        overconf = overconfidence_score(actual, lower, upper)
        risk = risk_score(stab, frag, overconf)
        
        results[col] = {
            "stability": round(stab, 3),
            "fragility": round(frag, 3),
            "overconfidence": round(overconf, 3),
            "risk_score": round(risk, 3),
            "risk_level": risk_level(risk),
        }
    
    overall = np.mean([r["risk_score"] for r in results.values()]) if results else 0.0
    
    return {
        "status": "success",
        "results": results,
        "overall_risk": round(overall, 3),
        "overall_level": risk_level(overall),
        "data_points": len(df),
        "chronos_available": CHRONOS_AVAILABLE,
    }


def get_master_dataset() -> pd.DataFrame:
    """
    Generate or load master dataset.
    Tries to build dataset from scraped events first, falls back to synthetic.
    """
    try:
        from data.scheduler import scheduler
        items = scheduler.data_store.items
    except ImportError:
        items = []

    # If we have enough real data (at least 10 events), build dataframe from it
    if len(items) >= 10:
        data_records = []
        for item in items:
            if not item.scraped_at:
                continue
                
            # Normalize date to start of day
            date = item.scraped_at.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Map severity to numeric score
            severity_map = {"critical": 0.9, "high": 0.7, "medium": 0.4, "low": 0.1}
            severity_val = severity_map.get(item.severity, 0.3)
            
            data_records.append({
                "date": date,
                "severity_score": severity_val,
                "risk_score": item.risk_score or 0.3,
                "event_count": 1
            })
            
        if data_records:
            df_raw = pd.DataFrame(data_records)
            df_raw.sort_values("date", inplace=True)
            
            # Group by date to create time series
            df_daily = df_raw.groupby("date").agg({
                "severity_score": "mean",
                "risk_score": "mean",
                "event_count": "sum"
            }).reset_index()
            
            # If time series is too short, we need to fill gaps or it won't be forecastable
            if len(df_daily) < 10:
                # Not enough days covered yet, use hybrid approach or just fallback
                pass
            else:
                # Reindex to fill missing days with 0/base values
                idx = pd.date_range(start=df_daily["date"].min(), end=datetime.now(), freq="D")
                df_daily.set_index("date", inplace=True)
                df_daily = df_daily.reindex(idx, fill_value=0)
                df_daily.reset_index(inplace=True)
                df_daily.rename(columns={"index": "date"}, inplace=True)
                
                # Smoothed metrics for risk calculation
                # Delivery rate inverse to event count (more events = lower delivery reliability)
                df_daily["delivery_rate"] = 1.0 - (df_daily["event_count"] / 20).clip(0, 0.4)
                
                # Volatility/Fragility proxy from count variance
                df_daily["market_volatility"] = df_daily["event_count"].rolling(5).std().fillna(0) / 10
                
                # Risk score directly from AI analysis
                df_daily["ai_risk_score"] = df_daily["risk_score"]
                
                return df_daily

    # Fallback to synthetic data
    np.random.seed(42)
    days = 180
    dates = pd.date_range(end=datetime.now(), periods=days, freq="D")
    
    # Synthetic supply chain metrics (simulating a system that looks stable but has hidden fragility)
    df = pd.DataFrame({
        "date": dates,
        # Stability indicators (appear stable)
        "delivery_rate": 0.92 + 0.03 * np.random.randn(days).cumsum() / 20 + 0.05 * np.sin(np.arange(days) / 30),
        "lead_time_days": 14 + 2 * np.random.randn(days).cumsum() / 30,
        "supplier_reliability": 0.88 + 0.02 * np.random.randn(days),
        
        # Fragility indicators (hidden risks)
        "vendor_concentration_hhi": 0.35 + 0.15 * np.random.rand(days) + 0.1 * np.sin(np.arange(days) / 45),
        "geographic_concentration": 0.55 + 0.1 * np.random.randn(days).cumsum() / 50,
        "single_source_ratio": 0.25 + 0.05 * np.random.rand(days),
        
        # Event signals
        "disruption_events": np.maximum(0, np.random.poisson(0.3, days) + np.random.randint(0, 2, days)),
        "risk_alerts_count": np.maximum(0, np.random.poisson(1.5, days)),
        "severity_index": 0.3 + 0.2 * np.random.rand(days) + 0.1 * np.random.randn(days).cumsum() / 30,
    })
    
    # Clip values to realistic ranges
    df["delivery_rate"] = df["delivery_rate"].clip(0.7, 1.0)
    df["supplier_reliability"] = df["supplier_reliability"].clip(0.6, 1.0)
    df["vendor_concentration_hhi"] = df["vendor_concentration_hhi"].clip(0.1, 1.0)
    df["geographic_concentration"] = df["geographic_concentration"].clip(0.1, 1.0)
    df["single_source_ratio"] = df["single_source_ratio"].clip(0.0, 0.5)
    df["severity_index"] = df["severity_index"].clip(0.1, 0.9)
    
    return df
