BAND_THRESHOLDS = {"C1": 8.5, "B2": 6.0, "B1": 4.0}


def score_to_band(score: float) -> str | None:
    for band, threshold in BAND_THRESHOLDS.items():
        if score >= threshold:
            return band
    return None


def round_score(score: float) -> float:
    return round(score * 2) / 2
