from app.scoring import round_score, score_to_band


def test_score_to_band_c1():
    assert score_to_band(8.5) == "C1"
    assert score_to_band(9.0) == "C1"
    assert score_to_band(10.0) == "C1"


def test_score_to_band_b2():
    assert score_to_band(8.4) == "B2"
    assert score_to_band(6.0) == "B2"
    assert score_to_band(7.5) == "B2"


def test_score_to_band_b1():
    assert score_to_band(5.9) == "B1"
    assert score_to_band(4.0) == "B1"
    assert score_to_band(4.5) == "B1"


def test_score_to_band_none():
    assert score_to_band(3.9) is None
    assert score_to_band(0) is None
    assert score_to_band(2.0) is None


def test_round_score_up():
    assert round_score(7.3) == 7.5
    assert round_score(7.8) == 8.0
    assert round_score(6.75) == 7.0


def test_round_score_down():
    assert round_score(7.2) == 7.0
    assert round_score(7.1) == 7.0
    assert round_score(6.24) == 6.0


def test_round_score_exact():
    assert round_score(0) == 0
    assert round_score(10) == 10
    assert round_score(7.5) == 7.5
    assert round_score(7.0) == 7.0
