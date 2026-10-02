"""
Fragility Indicators

Compute fragility metrics: HHI, Entropy, Geographic Clustering, SPOF.
"""

import math
from typing import Optional
from dataclasses import dataclass


@dataclass
class FragilityMetrics:
    """Fragility analysis results."""
    hhi_index: float  # Herfindahl-Hirschman Index (0-1, higher = more concentrated)
    entropy: float  # Diversity entropy (higher = more diverse)
    normalized_entropy: float  # 0-1 scale
    geographic_clustering: float  # 0-1, higher = more clustered
    single_points_of_failure: int  # Count of critical dependencies
    fragility_score: float  # Composite score (0-1, higher = more fragile)
    
    def to_dict(self) -> dict:
        return {
            "hhi_index": self.hhi_index,
            "entropy": self.entropy,
            "normalized_entropy": self.normalized_entropy,
            "geographic_clustering": self.geographic_clustering,
            "single_points_of_failure": self.single_points_of_failure,
            "fragility_score": self.fragility_score,
        }


class FragilityAnalyzer:
    """
    Analyze supply chain fragility.
    
    Computes concentration risk, diversity, and structural weaknesses.
    """
    
    def compute_hhi(self, market_shares: list[float]) -> float:
        """
        Compute Herfindahl-Hirschman Index.
        
        HHI = Σ(share_i)² where shares sum to 1
        
        Args:
            market_shares: List of market shares (should sum to ~1)
            
        Returns:
            HHI value (0-1 scale, normalized)
        """
        if not market_shares:
            return 0.0
        
        # Normalize shares
        total = sum(market_shares)
        if total == 0:
            return 0.0
        
        normalized = [s / total for s in market_shares]
        
        # Compute HHI
        hhi = sum(s ** 2 for s in normalized)
        
        # HHI ranges from 1/n to 1
        # Normalize to 0-1 scale
        n = len(normalized)
        if n <= 1:
            return 1.0
        
        min_hhi = 1 / n
        normalized_hhi = (hhi - min_hhi) / (1 - min_hhi)
        
        return max(0.0, min(1.0, normalized_hhi))
    
    def compute_entropy(self, shares: list[float]) -> tuple[float, float]:
        """
        Compute Shannon entropy for diversity measurement.
        
        Higher entropy = more diverse.
        
        Args:
            shares: List of proportional shares
            
        Returns:
            (entropy, normalized_entropy)
        """
        if not shares:
            return 0.0, 0.0
        
        # Normalize
        total = sum(shares)
        if total == 0:
            return 0.0, 0.0
        
        normalized = [s / total for s in shares]
        
        # Compute entropy
        entropy = 0.0
        for p in normalized:
            if p > 0:
                entropy -= p * math.log2(p)
        
        # Maximum entropy for n items
        n = len(normalized)
        max_entropy = math.log2(n) if n > 1 else 1.0
        
        normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0.0
        
        return entropy, normalized_entropy
    
    def compute_geographic_clustering(
        self,
        country_shares: dict[str, float],
        country_regions: Optional[dict[str, str]] = None,
    ) -> float:
        """
        Compute geographic concentration risk.
        
        Args:
            country_shares: Dict of country_code -> share
            country_regions: Optional mapping of country to region
            
        Returns:
            Clustering score (0-1, higher = more clustered)
        """
        if not country_shares:
            return 0.0
        
        # Default region mapping
        default_regions = {
            "CHN": "Asia", "JPN": "Asia", "KOR": "Asia", "TWN": "Asia",
            "VNM": "Asia", "THA": "Asia", "MYS": "Asia", "SGP": "Asia",
            "IND": "Asia", "IDN": "Asia", "PHL": "Asia",
            "USA": "Americas", "CAN": "Americas", "MEX": "Americas", "BRA": "Americas",
            "DEU": "Europe", "GBR": "Europe", "FRA": "Europe", "ITA": "Europe",
            "NLD": "Europe", "ESP": "Europe", "POL": "Europe",
        }
        
        regions = country_regions or default_regions
        
        # Aggregate by region
        region_shares = {}
        for country, share in country_shares.items():
            region = regions.get(country, "Other")
            region_shares[region] = region_shares.get(region, 0) + share
        
        # Compute HHI on regions
        return self.compute_hhi(list(region_shares.values()))
    
    def count_single_points_of_failure(
        self,
        dependency_shares: list[float],
        threshold: float = 0.5,
    ) -> int:
        """
        Count single points of failure.
        
        SPOF = any dependency with share > threshold.
        
        Args:
            dependency_shares: List of dependency shares
            threshold: Threshold for SPOF (default 50%)
            
        Returns:
            Count of SPOFs
        """
        if not dependency_shares:
            return 0
        
        total = sum(dependency_shares)
        if total == 0:
            return 0
        
        normalized = [s / total for s in dependency_shares]
        return sum(1 for s in normalized if s > threshold)
    
    def analyze(
        self,
        vendor_shares: Optional[list[float]] = None,
        country_shares: Optional[dict[str, float]] = None,
        commodity_shares: Optional[list[float]] = None,
    ) -> FragilityMetrics:
        """
        Perform complete fragility analysis.
        
        Args:
            vendor_shares: Market shares by vendor
            country_shares: Sourcing by country
            commodity_shares: Dependency by commodity
            
        Returns:
            FragilityMetrics
        """
        # Compute individual metrics
        vendor_hhi = self.compute_hhi(vendor_shares or [])
        
        country_list = list((country_shares or {}).values())
        country_hhi = self.compute_hhi(country_list)
        
        entropy, norm_entropy = self.compute_entropy(vendor_shares or country_list or [])
        
        geo_clustering = self.compute_geographic_clustering(country_shares or {})
        
        spof_count = self.count_single_points_of_failure(vendor_shares or [])
        
        # Composite HHI (average of vendor and country)
        composite_hhi = (vendor_hhi + country_hhi) / 2
        
        # Compute fragility score
        # Higher HHI = higher fragility
        # Lower entropy = higher fragility
        # Higher clustering = higher fragility
        # More SPOFs = higher fragility
        
        fragility_score = (
            composite_hhi * 0.35 +
            (1 - norm_entropy) * 0.25 +
            geo_clustering * 0.25 +
            min(spof_count / 3, 1.0) * 0.15
        )
        
        return FragilityMetrics(
            hhi_index=composite_hhi,
            entropy=entropy,
            normalized_entropy=norm_entropy,
            geographic_clustering=geo_clustering,
            single_points_of_failure=spof_count,
            fragility_score=fragility_score,
        )


# Global instance
fragility_analyzer = FragilityAnalyzer()
