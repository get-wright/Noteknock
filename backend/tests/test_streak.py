from datetime import date

from app.services.streak import (
    ActivityDay,
    compute_streak_stats,
    current_streak,
    longest_streak,
)


def test_current_streak_ends_today_or_yesterday_only():
    today = date(2026, 6, 24)
    assert current_streak({date(2026, 6, 23)}, today) == 1
    active_with_today = {date(2026, 6, 22), date(2026, 6, 23), today}
    assert current_streak(active_with_today, today) == 3


def test_longest_streak_with_gap():
    active = {
        date(2026, 6, 1),
        date(2026, 6, 2),
        date(2026, 6, 3),
        date(2026, 6, 10),
        date(2026, 6, 11),
    }
    assert longest_streak(active) == 3


def test_compute_streak_stats():
    rows = [
        ActivityDay(day=date(2026, 6, 22), notes_created=1),
        ActivityDay(day=date(2026, 6, 23), quizzes_taken=1),
        ActivityDay(day=date(2026, 6, 24), reviews_done=2),
    ]
    current, longest, total, heatmap = compute_streak_stats(rows, date(2026, 6, 24))
    assert current == 3
    assert longest == 3
    assert total == 3
    assert len(heatmap) == 3