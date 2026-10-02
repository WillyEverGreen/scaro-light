"""
PostgreSQL Database Models

SQLAlchemy models for Edgecase data storage.
"""

from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime,
    ForeignKey, Enum, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class EventCategory(str, PyEnum):
    """Event category enum."""
    GEOPOLITICAL = "geopolitical"
    WEATHER = "weather"
    TRADE_RESTRICTION = "trade_restriction"
    COMMODITY = "commodity"
    VENDOR = "vendor"
    ECONOMIC = "economic"
    OTHER = "other"


class EventSeverity(str, PyEnum):
    """Event severity enum."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Country(Base):
    """Country reference table."""
    __tablename__ = "countries"
    
    id = Column(Integer, primary_key=True)
    code = Column(String(3), unique=True, nullable=False)  # ISO 3166-1 alpha-3
    name = Column(String(100), nullable=False)
    region = Column(String(50))
    risk_score = Column(Float, default=0.0)
    is_sanctioned = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    vendors = relationship("Vendor", back_populates="country")
    events = relationship("Event", back_populates="country")


class Vendor(Base):
    """Supply chain vendor."""
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    country_id = Column(Integer, ForeignKey("countries.id"))
    industry = Column(String(100))
    tier = Column(Integer, default=1)  # Supply chain tier (1, 2, 3...)
    
    # Risk metrics
    stability_score = Column(Float, default=0.5)
    fragility_score = Column(Float, default=0.5)
    risk_score = Column(Float, default=0.5)
    is_critical = Column(Boolean, default=False)
    
    # Metadata
    website = Column(String(500))
    description = Column(Text)
    commodities = Column(JSON)  # List of commodities
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    country = relationship("Country", back_populates="vendors")
    risk_scores = relationship("RiskScore", back_populates="vendor")
    
    __table_args__ = (
        Index("ix_vendors_country_id", "country_id"),
        Index("ix_vendors_risk_score", "risk_score"),
    )


class Event(Base):
    """News events affecting supply chain."""
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False)
    content = Column(Text)
    summary = Column(Text)
    
    category = Column(Enum(EventCategory), nullable=False)
    severity = Column(Enum(EventSeverity), default=EventSeverity.LOW)
    
    source_url = Column(String(1000))
    source_type = Column(String(50))  # twitter, news, search, etc.
    source_name = Column(String(100))
    
    country_id = Column(Integer, ForeignKey("countries.id"))
    country_code = Column(String(3))
    
    # AI-generated
    ai_analysis = Column(Text)
    impact_score = Column(Float, default=0.0)
    keywords = Column(JSON)
    affected_commodities = Column(JSON)
    organizations = Column(JSON)
    
    published_at = Column(DateTime)
    scraped_at = Column(DateTime, default=func.now())
    processed = Column(Boolean, default=False)
    
    # Relationships
    country = relationship("Country", back_populates="events")
    
    __table_args__ = (
        Index("ix_events_category", "category"),
        Index("ix_events_severity", "severity"),
        Index("ix_events_scraped_at", "scraped_at"),
        Index("ix_events_country_id", "country_id"),
    )


class RiskScore(Base):
    """Historical risk score records."""
    __tablename__ = "risk_scores"
    
    id = Column(Integer, primary_key=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    country_code = Column(String(3))
    
    # Scores
    overall_score = Column(Float, nullable=False)
    stability_score = Column(Float)
    fragility_score = Column(Float)
    confidence_gap = Column(Float)
    
    # Fragility breakdown
    hhi_index = Column(Float)
    entropy = Column(Float)
    geographic_clustering = Column(Float)
    
    # Metadata
    calculated_at = Column(DateTime, default=func.now())
    
    # Relationships
    vendor = relationship("Vendor", back_populates="risk_scores")
    
    __table_args__ = (
        Index("ix_risk_scores_vendor_id", "vendor_id"),
        Index("ix_risk_scores_calculated_at", "calculated_at"),
    )


class ScrapingJob(Base):
    """Scraping job records."""
    __tablename__ = "scraping_jobs"
    
    id = Column(Integer, primary_key=True)
    job_id = Column(String(36), unique=True, nullable=False)
    source = Column(String(50), nullable=False)
    status = Column(String(20), default="pending")
    
    progress = Column(Float, default=0.0)
    items_scraped = Column(Integer, default=0)
    errors = Column(Integer, default=0)
    error_messages = Column(JSON)
    
    config = Column(JSON)
    
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    
    __table_args__ = (
        Index("ix_scraping_jobs_status", "status"),
        Index("ix_scraping_jobs_created_at", "created_at"),
    )


class TradeRestriction(Base):
    """Trade restrictions and sanctions."""
    __tablename__ = "trade_restrictions"
    
    id = Column(Integer, primary_key=True)
    source_country = Column(String(3), nullable=False)
    target_country = Column(String(3), nullable=False)
    
    restriction_type = Column(String(50))  # sanction, tariff, embargo, export_control
    description = Column(Text)
    commodities_affected = Column(JSON)
    
    severity = Column(Float, default=0.5)
    is_active = Column(Boolean, default=True)
    
    effective_date = Column(DateTime)
    expiry_date = Column(DateTime)
    source_url = Column(String(1000))
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index("ix_trade_restrictions_countries", "source_country", "target_country"),
        UniqueConstraint("source_country", "target_country", "restriction_type", name="uq_trade_restriction"),
    )


class WeatherAlert(Base):
    """Weather alerts affecting supply chains."""
    __tablename__ = "weather_alerts"
    
    id = Column(Integer, primary_key=True)
    alert_type = Column(String(50), nullable=False)  # hurricane, flood, drought, etc.
    severity = Column(String(20))
    
    country_code = Column(String(3))
    region = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    
    description = Column(Text)
    impact_assessment = Column(Text)
    affected_ports = Column(JSON)
    affected_routes = Column(JSON)
    
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    is_active = Column(Boolean, default=True)
    
    source = Column(String(100))
    created_at = Column(DateTime, default=func.now())
    
    __table_args__ = (
        Index("ix_weather_alerts_country", "country_code"),
        Index("ix_weather_alerts_active", "is_active"),
    )


class Alert(Base):
    """System alerts and notifications."""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True)
    alert_id = Column(String(36), unique=True, nullable=False)
    
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    
    title = Column(String(300), nullable=False)
    message = Column(Text)
    ai_recommendation = Column(Text)
    
    affected_entities = Column(JSON)
    country_code = Column(String(3))
    
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime)
    acknowledged_by = Column(String(100))
    
    created_at = Column(DateTime, default=func.now())
    
    __table_args__ = (
        Index("ix_alerts_category", "category"),
        Index("ix_alerts_severity", "severity"),
        Index("ix_alerts_acknowledged", "acknowledged"),
    )
