from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta


@dataclass(frozen=True)
class ActivityDay:
    day: date
    notes_created: int = 0
    quizzes_taken: int = 0
    reviews_done: int = 0

    @property
    def total(self) -> int:
        return self.notes_created + self.quizzes_taken + self.reviews_done


def merge_activity_rows(rows: list[ActivityDay]) -> list[ActivityDay]:
    by_day: dict[date, ActivityDay] = {}
    for row in rows:
        existing = by_day.get(row.day)
        if existing is None:
            by_day[row.day] = row
        else:
            by_day[row.day] = ActivityDay(
                day=row.day,
                notes_created=existing.notes_created + row.notes_created,
                quizzes_taken=existing.quizzes_taken + row.quizzes_taken,
                reviews_done=existing.reviews_done + row.reviews_done,
            )
    return sorted(by_day.values(), key=lambda r: r.day)


def active_dates_from_activity(rows: list[ActivityDay]) -> set[date]:
    return {r.day for r in rows if r.total >= 1}


def longest_streak(active: set[date]) -> int:
    if not active:
        return 0
    best = 1
    current = 1
    sorted_days = sorted(active)
    for i in range(1, len(sorted_days)):
        if sorted_days[i] - sorted_days[i - 1] == timedelta(days=1):
            current += 1
            best = max(best, current)
        else:
            current = 1
    return best


def current_streak(active: set[date], today: date) -> int:
    if not active:
        return 0
    anchor = today
    if anchor not in active:
        anchor = today - timedelta(days=1)
        if anchor not in active:
            return 0
    count = 0
    d = anchor
    while d in active:
        count += 1
        d -= timedelta(days=1)
    return count


def compute_streak_stats(
    rows: list[ActivityDay], today: date
) -> tuple[int, int, int, list[tuple[date, int]]]:
    merged = merge_activity_rows(rows)
    active = active_dates_from_activity(merged)
    heatmap = [(r.day, r.total) for r in merged if r.total >= 1]
    return (
        current_streak(active, today),
        longest_streak(active),
        len(active),
        heatmap,
    )


REVIEW_INTERVAL_DAYS: dict[int, int] = {
    0: 0,
    1: 1,
    2: 3,
    3: 7,
}


def review_interval_days(strength: int) -> int:
    return REVIEW_INTERVAL_DAYS.get(strength, 0)