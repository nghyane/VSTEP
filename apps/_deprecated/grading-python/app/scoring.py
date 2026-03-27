BAND_THRESHOLDS = {"C1": 8.5, "B2": 6.0, "B1": 4.0}


def to_band(score: float) -> str | None:
    for band, threshold in BAND_THRESHOLDS.items():
        if score >= threshold:
            return band
    return None


def snap(score: float) -> float:
    """Snap score to nearest 0.5 increment."""
    return round(score * 2) / 2
