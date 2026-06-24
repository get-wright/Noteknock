import {
  ArrowLeft,
  BookOpen,
  CircleHelp,
  Flame,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getActivity,
  getStreak,
  type ActivityDay,
  type StreakStats,
} from "../api/activity";

const MONTH_SHORT = [
  "Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12",
];
const MONTH_LONG = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
const WEEKS = 17;
const CHART_POINTS = 14;
const MS_PER_DAY = 86_400_000;

function todayUtcIso(): string {
  const n = new Date();
  const y = n.getUTCFullYear();
  const m = String(n.getUTCMonth() + 1).padStart(2, "0");
  const d = String(n.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function utcCalendarAddDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + delta * MS_PER_DAY;
  const nd = new Date(t);
  const yy = nd.getUTCFullYear();
  const mm = String(nd.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(nd.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function utcWeekdayMon0(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

function utcMonthIndex(iso: string): number {
  return Number(iso.split("-")[1]) - 1;
}

function utcYear(iso: string): number {
  return Number(iso.split("-")[0]);
}

function formatIsoDdMm(iso: string): string {
  const [, mo, da] = iso.split("-");
  return `${da}/${mo}`;
}

function countLevel(count: number, maxCount: number): number {
  if (count <= 0) return 0;
  if (maxCount <= 0) return 1;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function heatmapLevelLabel(level: number, count: number): string {
  if (level === 0) return "Không hoạt động";
  if (count === 1) return "1 hoạt động";
  return `${count} hoạt động`;
}

function levelBg(level: number): string {
  if (level === 0) return "var(--track)";
  if (level === 1) return "color-mix(in srgb, var(--accent) 28%, transparent)";
  if (level === 2) return "color-mix(in srgb, var(--accent) 52%, transparent)";
  if (level === 3) return "color-mix(in srgb, var(--accent) 76%, transparent)";
  return "var(--accent)";
}

function activityTotal(row: ActivityDay): number {
  return row.notesCreated + row.quizzesTaken + row.reviewsDone;
}

function formatTimelineDate(iso: string, todayIso: string): string {
  if (iso === todayIso) return "Hôm nay";
  return formatIsoDdMm(iso);
}

function activityTitle(row: ActivityDay): string {
  const parts: string[] = [];
  if (row.notesCreated > 0) parts.push(`${row.notesCreated} bài học mới`);
  if (row.quizzesTaken > 0) parts.push(`${row.quizzesTaken} quiz`);
  if (row.reviewsDone > 0) parts.push(`${row.reviewsDone} lượt ôn tập`);
  if (parts.length === 0) return "Hoạt động học tập";
  if (parts.length === 1) {
    if (row.notesCreated > 0) return `Tạo ${parts[0]}`;
    if (row.quizzesTaken > 0) return `Hoàn thành ${parts[0]}`;
    return `Ôn tập — ${parts[0]}`;
  }
  return parts.join(" · ");
}

function activitySub(row: ActivityDay): string {
  const bits: string[] = [];
  if (row.notesCreated > 0) bits.push(`${row.notesCreated} bài học`);
  if (row.quizzesTaken > 0) bits.push(`${row.quizzesTaken} quiz`);
  if (row.reviewsDone > 0) bits.push(`${row.reviewsDone} lượt ôn`);
  return bits.join(" · ");
}

function pickTimelineIcon(row: ActivityDay) {
  if (row.reviewsDone >= row.notesCreated && row.reviewsDone >= row.quizzesTaken) return RefreshCcw;
  if (row.quizzesTaken >= row.notesCreated) return CircleHelp;
  return BookOpen;
}

type TimelineGroup = { month: string; year: string; items: ActivityDay[] };

function groupTimelineByMonth(rows: ActivityDay[]): TimelineGroup[] {
  const groups: TimelineGroup[] = [];
  let current: TimelineGroup | null = null;
  for (const row of rows) {
    const month = MONTH_LONG[utcMonthIndex(row.date)];
    const year = String(utcYear(row.date));
    if (!current || current.month !== month || current.year !== year) {
      current = { month, year, items: [] };
      groups.push(current);
    }
    current.items.push(row);
  }
  return groups;
}

type HeatCell = { iso: string; future: boolean; count: number; level: number };

function buildHeatmapGrid(
  heatmap: { date: string; count: number }[],
  todayIso: string,
): { cols: HeatCell[][]; monthLabels: string[] } {
  const countByDate = new Map(heatmap.map((h) => [h.date, h.count]));
  const dow = utcWeekdayMon0(todayIso);
  const gridStartIso = utcCalendarAddDays(todayIso, -dow - (WEEKS - 1) * 7);
  const cols: HeatCell[][] = [];
  const visibleCounts: number[] = [];
  const monthsSeen = new Set<number>();
  const monthLabels: string[] = [];

  for (let w = 0; w < WEEKS; w++) {
    const days: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = utcCalendarAddDays(gridStartIso, w * 7 + d);
      const future = iso > todayIso;
      const count = future ? 0 : (countByDate.get(iso) ?? 0);
      if (!future) visibleCounts.push(count);
      const mo = utcMonthIndex(iso);
      if (!monthsSeen.has(mo)) {
        monthsSeen.add(mo);
        monthLabels.push(MONTH_SHORT[mo]);
      }
      days.push({ iso, future, count, level: 0 });
    }
    cols.push(days);
  }

  const maxCount = Math.max(1, ...visibleCounts);
  for (const week of cols) {
    for (const cell of week) {
      if (!cell.future) cell.level = countLevel(cell.count, maxCount);
    }
  }
  return { cols, monthLabels };
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function chartAccessibleSummary(dayIsos: string[], series: number[]): string {
  const total = series.reduce((a, b) => a + b, 0);
  const peak = Math.max(0, ...series);
  const peakIdx = series.indexOf(peak);
  const last = series[series.length - 1] ?? 0;
  const peakDay = dayIsos[peakIdx] ?? todayUtcIso();
  const lastDay = dayIsos[dayIsos.length - 1] ?? todayUtcIso();
  return `Tổng ${total} hoạt động trong ${CHART_POINTS} ngày (theo ngày UTC). Cao nhất: ${peak} hoạt động vào ${formatIsoDdMm(peakDay)}. Ngày ${formatIsoDdMm(lastDay)}: ${last} hoạt động.`;
}

function GrowthChart({
  series,
  dayIsos,
  summaryId,
}: {
  series: number[];
  dayIsos: string[];
  summaryId: string;
}) {
  const W = 560;
  const H = 200;
  const padX = 18;
  const top = 18;
  const bottom = 160;
  const n = series.length;
  const maxV = Math.max(1, ...series);
  const xAt = (i: number) => padX + (i * (W - padX * 2)) / Math.max(1, n - 1);
  const yAt = (v: number) => bottom - (v / maxV) * (bottom - top);
  const pts = series.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const line = smoothPath(pts);
  const area =
    pts.length > 0
      ? `${line} L${pts[n - 1].x.toFixed(1)},${bottom} L${pts[0].x.toFixed(1)},${bottom} Z`
      : "";
  const last = pts[n - 1];
  const gridYs = [0.3, 0.6, 0.9].map((f) => yAt(maxV * f));
  const title = "Biểu đồ xu hướng hoạt động theo ngày UTC";

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={summaryId}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          marginTop: 6,
          overflow: "visible",
        }}
      >
        <title>{title}</title>
        <defs>
          <linearGradient id="smgrad-streak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.26} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {gridYs.map((y, i) => (
          <line key={i} x1={padX} y1={y} x2={W - padX} y2={y} stroke="var(--border)" strokeWidth={1} />
        ))}
        {area ? <path d={area} fill="url(#smgrad-streak)" /> : null}
        {line ? (
          <path
            d={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {pts.slice(0, -1).map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2.8}
            fill="var(--paper)"
            stroke="var(--accent)"
            strokeWidth={2}
          />
        ))}
        {last ? (
          <>
            <circle
              className="sm-halo"
              cx={last.x}
              cy={last.y}
              r={6}
              fill="var(--accent)"
              style={{
                transformOrigin: `${last.x}px ${last.y}px`,
                animation: "sm-halo 2.6s ease-in-out infinite",
              }}
            />
            <circle cx={last.x} cy={last.y} r={4.6} fill="var(--accent)" stroke="var(--paper)" strokeWidth={2} />
          </>
        ) : null}
      </svg>
      <p id={summaryId} style={{ fontSize: ".78rem", color: "var(--muted)", margin: "10px 0 0", lineHeight: 1.45 }}>
        {chartAccessibleSummary(dayIsos, series)}
      </p>
    </div>
  );
}

function ActivityHeatmap({
  heatmap,
  todayIso,
}: {
  heatmap: { date: string; count: number }[];
  todayIso: string;
}) {
  const { cols, monthLabels } = useMemo(
    () => buildHeatmapGrid(heatmap, todayIso),
    [heatmap, todayIso],
  );
  const dayLabels = ["T2", "", "T4", "", "T6", "", ""];
  const flatCells = cols.flat().filter((c) => !c.future);

  return (
    <div>
      <div
        role="img"
        aria-label="Lịch hoạt động 17 tuần theo ngày UTC, màu đậm hơn khi có nhiều hoạt động hơn"
        style={{ display: "flex", gap: 8 }}
      >
        <div
          style={{
            flex: "0 0 auto",
            width: 18,
            display: "flex",
            flexDirection: "column",
            gap: 5,
            paddingTop: 21,
          }}
        >
          {dayLabels.map((l, i) => (
            <div
              key={i}
              style={{
                height: 14,
                lineHeight: "14px",
                fontSize: ".6rem",
                color: "var(--faint)",
                textAlign: "right",
              }}
            >
              {l}
            </div>
          ))}
        </div>
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: ".64rem",
              color: "var(--muted)",
              marginBottom: 7,
              padding: "0 1px",
            }}
          >
            {monthLabels.map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {cols.map((week, wi) => (
              <div
                key={wi}
                style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 0" }}
              >
                {week.map((c) =>
                  c.future ? (
                    <div
                      key={c.iso}
                      aria-hidden
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: 4,
                        background: "transparent",
                      }}
                    />
                  ) : (
                    <div
                      key={c.iso}
                      role="img"
                      title={`${c.iso} (UTC): ${heatmapLevelLabel(c.level, c.count)}`}
                      aria-label={`${formatIsoDdMm(c.iso)} UTC: ${heatmapLevelLabel(c.level, c.count)}`}
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: 4,
                        background: levelBg(c.level),
                      }}
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ul
        className="sr-only"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {flatCells.map((c) => (
          <li key={c.iso}>
            {c.iso}: {heatmapLevelLabel(c.level, c.count)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function chartSeriesFromActivity(
  rows: ActivityDay[],
  todayIso: string,
): { series: number[]; dayIsos: string[] } {
  const byDate = new Map(rows.map((r) => [r.date, activityTotal(r)]));
  const series: number[] = [];
  const dayIsos: string[] = [];
  for (let i = CHART_POINTS - 1; i >= 0; i--) {
    const iso = utcCalendarAddDays(todayIso, -i);
    dayIsos.push(iso);
    series.push(byDate.get(iso) ?? 0);
  }
  return { series, dayIsos };
}

export default function StreakPage() {
  const navigate = useNavigate();
  const chartSummaryId = useId();
  const [streak, setStreak] = useState<StreakStats | null>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const todayIso = useMemo(() => todayUtcIso(), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!mountedRef.current) return;
      setLoading(true);
      setError(null);
      try {
        const fromIso = utcCalendarAddDays(todayIso, -120);
        const [streakData, activityData] = await Promise.all([
          getStreak(),
          getActivity({ from: fromIso, to: todayIso }),
        ]);
        if (cancelled || !mountedRef.current) return;
        setStreak(streakData);
        setActivity(
          activityData
            .filter((r) => activityTotal(r) > 0)
            .sort((a, b) => b.date.localeCompare(a.date)),
        );
      } catch (e) {
        if (cancelled || !mountedRef.current) return;
        setError(e instanceof Error ? e.message : "Không tải được dữ liệu chuỗi học");
        setStreak(null);
        setActivity([]);
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [todayIso]);

  const { series: chartSeries, dayIsos: chartDayIsos } = useMemo(
    () => chartSeriesFromActivity(activity, todayIso),
    [activity, todayIso],
  );
  const timelineGroups = useMemo(
    () => groupTimelineByMonth(activity.slice(0, 24)),
    [activity],
  );
  const heatmapData = streak?.heatmap ?? [];
  const legendSwatches = [
    "var(--track)",
    "color-mix(in srgb, var(--accent) 28%, transparent)",
    "color-mix(in srgb, var(--accent) 52%, transparent)",
    "color-mix(in srgb, var(--accent) 76%, transparent)",
    "var(--accent)",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", padding: "28px 20px 48px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
        <button
          type="button"
          onClick={() => navigate("/app")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--muted)",
            fontFamily: "var(--body)",
            fontSize: ".9rem",
            marginBottom: 18,
            padding: 0,
          }}
        >
          <ArrowLeft size={18} /> Bài học
        </button>
        <section className="sm-fade">
          {error ? (
            <p style={{ color: "var(--rose)", fontSize: ".92rem", marginBottom: 16 }}>{error}</p>
          ) : null}
          <section
            style={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: 22,
              boxShadow: "var(--shadow)",
              padding: 22,
              marginBottom: 16,
            }}
          >
            <span style={{ position: "absolute", inset: 0, background: "var(--accent-tint)", pointerEvents: "none" }} />
            <span
              className="sm-pulse"
              style={{
                position: "relative",
                width: 58,
                height: 58,
                flex: "0 0 auto",
                padding: 14,
                borderRadius: 17,
                background: "var(--accent)",
                color: "#fff",
                boxShadow: "var(--coral-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flame size={30} fill="currentColor" />
            </span>
            <div style={{ position: "relative" }}>
              <div style={{ fontFamily: "var(--mono)", fontWeight: 600, color: "var(--ink)", lineHeight: 1 }}>
                <span style={{ fontSize: "2.3rem", letterSpacing: "-.02em" }}>
                  {loading ? "…" : (streak?.current ?? 0)}
                </span>
                <span style={{ fontSize: "1rem", color: "var(--muted)", marginLeft: 4 }}>ngày</span>
              </div>
              <div style={{ fontSize: ".86rem", color: "var(--muted)", marginTop: 6 }}>
                Chuỗi học hiện tại — cố lên nhé!
              </div>
            </div>
          </section>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              { v: loading ? "…" : String(streak?.longest ?? 0), u: "ngày", k: "Chuỗi dài nhất" },
              { v: loading ? "…" : String(streak?.total ?? 0), u: "ngày", k: "Tổng ngày đã học" },
            ].map((s) => (
              <div
                key={s.k}
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div style={{ fontFamily: "var(--mono)", fontWeight: 600, fontSize: "1.3rem", color: "var(--ink)", lineHeight: 1 }}>
                  {s.v}
                  <span style={{ fontSize: ".74rem", color: "var(--muted)", marginLeft: 3 }}>{s.u}</span>
                </div>
                <div style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: 8 }}>{s.k}</div>
              </div>
            ))}
          </div>
          <section
            style={{
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              boxShadow: "var(--shadow)",
              padding: "20px 18px 16px",
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-.01em", margin: "0 0 16px" }}>
              Hoạt động học tập
            </h3>
            <p style={{ fontSize: ".72rem", color: "var(--faint)", margin: "0 0 10px" }}>
              Ngày theo múi giờ UTC (khớp với máy chủ)
            </p>
            {loading ? (
              <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>Đang tải lịch…</p>
            ) : (
              <>
                <ActivityHeatmap heatmap={heatmapData} todayIso={todayIso} />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                    marginTop: 14,
                    fontSize: ".7rem",
                    color: "var(--muted)",
                  }}
                >
                  Ít
                  {legendSwatches.map((bg, i) => (
                    <span key={i} style={{ width: 12, height: 12, borderRadius: 3, background: bg }} />
                  ))}
                  Nhiều
                </div>
              </>
            )}
          </section>
          <section
            style={{
              background: "var(--paper)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              boxShadow: "var(--shadow)",
              padding: "20px 18px 16px",
              marginBottom: 26,
            }}
          >
            <h3 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-.01em", margin: "0 0 8px" }}>
              Xu hướng hoạt động
            </h3>
            <p style={{ fontSize: ".78rem", color: "var(--muted)", margin: "0 0 4px" }}>
              Tổng hoạt động mỗi ngày UTC — {CHART_POINTS} ngày gần nhất
            </p>
            {loading ? (
              <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>Đang tải biểu đồ…</p>
            ) : (
              <GrowthChart series={chartSeries} dayIsos={chartDayIsos} summaryId={chartSummaryId} />
            )}
          </section>
          <section style={{ marginTop: 26 }}>
            <h3 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-.01em", margin: "0 2px 4px" }}>
              Hoạt động gần đây
            </h3>
            {loading ? (
              <p style={{ color: "var(--muted)", fontSize: ".92rem" }}>Đang tải…</p>
            ) : timelineGroups.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: ".92rem", lineHeight: 1.5, padding: "12px 2px" }}>
                Chưa có hoạt động nào được ghi nhận. Tạo bài học, làm quiz hoặc ôn tập để bắt đầu chuỗi học của bạn.
              </p>
            ) : (
              timelineGroups.map((grp) => (
                <div key={`${grp.month}-${grp.year}`}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: ".86rem",
                      fontWeight: 700,
                      padding: "14px 2px 4px",
                      color: "var(--ink)",
                    }}
                  >
                    {grp.month}{" "}
                    <span style={{ color: "var(--muted)", fontWeight: 500 }}>{grp.year}</span>
                    <span style={{ flex: "1 1 auto", height: 1, background: "var(--border)" }} />
                  </div>
                  <div style={{ position: "relative", padding: "16px 0 2px" }}>
                    <span style={{ position: "absolute", left: 17, top: 6, bottom: 14, width: 2, background: "var(--border)" }} />
                    {grp.items.map((row) => {
                      const Icon = pickTimelineIcon(row);
                      return (
                        <div key={row.date} style={{ position: "relative", display: "flex", gap: 14, marginBottom: 20 }}>
                          <span
                            style={{
                              position: "relative",
                              zIndex: 1,
                              width: 36,
                              height: 36,
                              flex: "0 0 auto",
                              padding: 8,
                              borderRadius: "50%",
                              background: "var(--paper)",
                              border: "1px solid var(--border)",
                              color: "var(--accent)",
                              boxShadow: "var(--shadow)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon size={19} />
                          </span>
                          <div style={{ flex: "1 1 auto", minWidth: 0, paddingTop: 6 }}>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                              <span style={{ fontSize: ".96rem", fontWeight: 600, letterSpacing: "-.01em", color: "var(--ink)", lineHeight: 1.35 }}>
                                {activityTitle(row)}
                              </span>
                              <span style={{ flex: "0 0 auto", fontFamily: "var(--mono)", fontSize: ".72rem", color: "var(--faint)" }}>
                                {formatTimelineDate(row.date, todayIso)}
                              </span>
                            </div>
                            <div style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: 3 }}>{activitySub(row)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </section>
        </section>
      </div>
    </div>
  );
}
