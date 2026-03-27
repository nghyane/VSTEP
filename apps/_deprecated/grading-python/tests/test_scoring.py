from app.scoring import snap, to_band


def test_to_band_c1():
    assert to_band(8.5) == "C1"
    assert to_band(9.0) == "C1"
    assert to_band(10.0) == "C1"


def test_to_band_b2():
    assert to_band(8.4) == "B2"
    assert to_band(6.0) == "B2"
    assert to_band(7.5) == "B2"


def test_to_band_b1():
    assert to_band(5.9) == "B1"
    assert to_band(4.0) == "B1"
    assert to_band(4.5) == "B1"


def test_to_band_none():
    assert to_band(3.9) is None
    assert to_band(0) is None
    assert to_band(2.0) is None


def test_snap_up():
    assert snap(7.3) == 7.5
    assert snap(7.8) == 8.0
    assert snap(6.75) == 7.0


def test_snap_down():
    assert snap(7.2) == 7.0
    assert snap(7.1) == 7.0
    assert snap(6.24) == 6.0


def test_snap_exact():
    assert snap(0) == 0
    assert snap(10) == 10
    assert snap(7.5) == 7.5
    assert snap(7.0) == 7.0
