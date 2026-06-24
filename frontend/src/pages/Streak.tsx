import {
  ArrowLeft,
  BookOpen,
  CircleHelp,
  Flame,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
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
  const d = parseIsoDate(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
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
    const d = parseIsoDate(row.date);
    const month = MONTH_LONG[d.getMonth()];
    const year = String(d.getFullYear());
    if (!current || current.month !== month || current.year !== year) {
      current = { month, year, items: [] };
      groups.push(current);
    }
    current.items.push(row);
  }
  return groups;
}
function buildHeatmapGrid(heatmap: { date: string; count: number }[], today: Date) {
  const countByDate = new Map(heatmap.map((h) => [h.date, h.count]));
  const maxCount = Math.max(1, ...heatmap.map((h) => h.count));
  const todayStart = startOfLocalDay(today);
  const dow = mondayIndex(todayStart);
  const lastMon = new Date(todayStart);
  lastMon.setDate(todayStart.getDate() - dow);
  const start = new Date(lastMon);
  start.setDate(lastMon.getDate() - (WEEKS - 1) * 7);
  const cols: { future: boolean; level: number }[][] = [];
  const monthsSeen = new Set<number>();
  const monthLabels: string[] = [];
  for (let w = 0; w < WEEKS; w++) {
    const days: { future: boolean; level: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      if (date > todayStart) {
        days.push({ future: true, level: 0 });
        continue;
      }
      const iso = isoLocal(date);
      const count = countByDate.get(iso) ?? 0;
      days.push({ future: false, level: countLevel(count, maxCount) });
      const m = date.getMonth();
      if (!monthsSeen.has(m)) {
        monthsSeen.add(m);
        monthLabels.push(MONTH_SHORT[m]);
      }
    }
    cols.push(days);
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
function GrowthChart({ series }: { series: number[] }) {
  const W = 560, H = 200, padX = 18, top = 18, bottom = 160, n = series.length;
  const maxV = Math.max(1, ...series);
  const xAt = (i: number) => padX + (i * (W - padX * 2)) / Math.max(1, n - 1);
  const yAt = (v: number) => bottom - (v / maxV) * (bottom - top);
  const pts = series.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const line = smoothPath(pts);
  const area = pts.length > 0 ? `${line} L${pts[n - 1].x.toFixed(1)},${bottom} L${pts[0].x.toFixed(1)},${bottom} Z` : "";
  const last = pts[n - 1];
  const gridYs = [0.3, 0.6, 0.9].map((f) => yAt(maxV * f));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "auto", display: "block", marginTop: 6, overflow: "visible" }} aria-hidden>
      <defs>
        <linearGradient id="smgrad-streak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.26} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {gridYs.map((y, i) => <line key={i} x1={padX} y1={y} x2={W - padX} y2={y} stroke="var(--border)" strokeWidth={1} />)}
      {area ? <path d={area} fill="url(#smgrad-streak)" /> : null}
      {line ? <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {pts.slice(0, -1).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.8} fill="var(--paper)" stroke="var(--accent)" strokeWidth={2} />)}
      {last ? (
        <>
          <circle className="sm-halo" cx={last.x} cy={last.y} r={6} fill="var(--accent)" style={{ transformOrigin: `${last.x}px ${last.y}px`, animation: "sm-halo 2.6s ease-in-out infinite" }} />
          <circle cx={last.x} cy={last.y} r={4.6} fill="var(--accent)" stroke="var(--paper)" strokeWidth={2} />
        </>
      ) : null}
    </svg>
  );
}
function ActivityHeatmap({ heatmap, today }: { heatmap: { date: string; count: number }[]; today: Date }) {
  const { cols, monthLabels } = useMemo(() => buildHeatmapGrid(heatmap, today), [heatmap, today]);
  const dayLabels = ["T2", "", "T4", "", "T6", "", ""];
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ flex: "0 0 auto", width: 18, display: "flex", flexDirection: "column", gap: 5, paddingTop: 21 }}>
        {dayLabels.map((l, i) => <div key={i} style={{ height: 14, lineHeight: "14px", fontSize: ".6rem", color: "var(--faint)", textAlign: "right" }}>{l}</div>)}
      </div>
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".64rem", color: "var(--muted)", marginBottom: 7, padding: "0 1px" }}>
          {monthLabels.map((m, i) => <span key={i}>{m}</span>)}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {cols.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 0" }}>
              {week.map((c, di) => (
                <div key={di} style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 4, background: c.future ? "transparent" : levelBg(c.level) }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function chartSeriesFromActivity(rows: ActivityDay[], today: Date): number[] {
  const byDate = new Map(rows.map((r) => [r.date, activityTotal(r)]));
  const series: number[] = [];
  for (let i = CHART_POINTS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    series.push(byDate.get(isoLocal(d)) ?? 0);
  }
  return series;
}
export default function StreakPage() {
  const navigate = useNavigate();
  const [streak, setStreak] = useState<StreakStats | null>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const todayIso = useMemo(() => isoLocal(today), [today]);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!mountedRef.current) return;
      setLoading(true);
      setError(null);
      try {
        const from = new Date(today);
        from.setDate(today.getDate() - 120);
        const [streakData, activityData] = await Promise.all([
          getStreak(),
          getActivity({ from: isoLocal(from), to: todayIso }),
        ]);
        if (cancelled || !mountedRef.current) return;
        setStreak(streakData);
        setActivity(activityData.filter((r) => activityTotal(r) > 0).sort((a, b) => b.date.localeCompare(a.date)));
      } catch (e) {
        if (cancelled || !mountedRef.current) return;
        setError(e instanceof Error ? e.message : "Không tải được dữ liệu chuỗi học");
        setStreak(null);
        setActivity([]);
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [today, todayIso]);
  const chartSeries = useMemo(() => chartSeriesFromActivity(activity, today), [activity, today]);
  const timelineGroups = useMemo(() => groupTimelineByMonth(activity.slice(0, 24)), [activity]);
  const heatmapData = streak?.heatmap ?? [];
  const legendSwatches = ["var(--track)", "color-mix(in srgb, var(--accent) 28%, transparent)", "color-mix(in srgb, var(--accent) 52%, transparent)", "color-mix(in srgb, var(--accent) 76%, transparent)", "var(--accent)"];
  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", padding: "28px 20px 48px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
        <button type="button" onClick={() => navigate("/app")} style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "none", background: "none", cursor: "pointer", color: "var(--muted)", fontFamily: "var(--body)", fontSize: ".9rem", marginBottom: 18, padding: 0 }}>
          <ArrowLeft size={18} /> Bài học
        </button>
        <section className="sm-fade">
          {error ? <p style={{ color: "var(--rose)", fontSize: ".92rem", marginBottom: 16 }}>{error}</p> : null}
          <section style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 16, background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 22, boxShadow: "var(--shadow)", padding: 22, marginBottom: 16 }}>
            <span style={{ position: "absolute", inset: 0, background: "var(--accent-tint)", pointerEvents: "none" }} />
            <span className="sm-pulse" style={{ position: "relative", width: 58, height: 58, flex: "0 0 auto", padding: 14, borderRadius: 17, background: "var(--accent)", color: "#fff", boxShadow: "var(--coral-glow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flame size={30} fill="currentColor" />
            </span>
            <div style={{ position: "relative" }}>
              <div style={{ fontFamily: "var(--mono)", fontWeight: 600, color: "var(--ink)", lineHeight: 1 }}>
                <span style={{ fontSize: "2.3rem", letterSpacing: "-.02em" }}>{loading ? "…" : (streak?.current ?? 0)}</span>
                <span style={{ fontSize: "1rem", color: "var(--muted)", marginLeft: 4 }}>ngày</span>
              </div>
              <div style={{ fontSize: ".86rem", color: "var(--muted)", marginTop: 6 }}>Chuỗi học hiện tại — cố lên nhé!</div>
            </div>
          </section>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[{ v: loading ? "…" : String(streak?.longest ?? 0), u: "ngày", k: "Chuỗi dài nhất" }, { v: loading ? "…" : String(streak?.total ?? 0), u: "ngày", k: "Tổng ngày đã học" }].map((s) => (
              <div key={s.k} style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 16px", boxShadow: "var(--shadow)" }}>
                <div style={{ fontFamily: "var(--mono)", fontWeight: 600, fontSize: "1.3rem", color: "var(--ink)", lineHeight: 1 }}>{s.v}<span style={{ fontSize: ".74rem", color: "var(--muted)", marginLeft: 3 }}>{s.u}</span></div>
                <div style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: 8 }}>{s.k}</div>
              </div>
            ))}
          </div>
          <section style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "var(--shadow)", padding: "20px 18px 16px", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-.01em", margin: "0 0 16px" }}>Hoạt động học tập</h3>
            {loading ? <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>Đang tải lịch…</p> : (
              <>
                <ActivityHeatmap heatmap={heatmapData} today={today} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 14, fontSize: ".7rem", color: "var(--muted)" }}>
                  Ít
                  {legendSwatches.map((bg, i) => <span key={i} style={{ width: 12, height: 12, borderRadius: 3, background: bg }} />)}
                  Nhiều
                </div>
              </>
            )}
          </section>
          <section style={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "var(--shadow)", padding: "20px 18px 16px", marginBottom: 26 }}>
            <h3 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-.01em", margin: "0 0 8px" }}>Xu hướng hoạt động</h3>
            <p style={{ fontSize: ".78rem", color: "var(--muted)", margin: "0 0 4px" }}>Tổng hoạt động mỗi ngày — {CHART_POINTS} ngày gần nhất</p>
            {loading ? <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>Đang tải biểu đồ…</p> : <GrowthChart series={chartSeries} />}
          </section>
          <section style={{ marginTop: 26 }}>
            <h3 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-.01em", margin: "0 2px 4px" }}>Hoạt động gần đây</h3>
            {loading ? <p style={{ color: "var(--muted)", fontSize: ".92rem" }}>Đang tải…</p> : timelineGroups.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: ".92rem", lineHeight: 1.5, padding: "12px 2px" }}>Chưa có hoạt động nào được ghi nhận. Tạo bài học, làm quiz hoặc ôn tập để bắt đầu chuỗi học của bạn.</p>
            ) : timelineGroups.map((grp) => (
              <div key={`${grp.month}-${grp.year}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".86rem", fontWeight: 700, padding: "14px 2px 4px", color: "var(--ink)" }}>
                  {grp.month} <span style={{ color: "var(--muted)", fontWeight: 500 }}>{grp.year}</span>
                  <span style={{ flex: "1 1 auto", height: 1, background: "var(--border)" }} />
                </div>
                <div style={{ position: "relative", padding: "16px 0 2px" }}>
                  <span style={{ position: "absolute", left: 17, top: 6, bottom: 14, width: 2, background: "var(--border)" }} />
                  {grp.items.map((row) => {
                    const Icon = pickTimelineIcon(row);
                    return (
                      <div key={row.date} style={{ position: "relative", display: "flex", gap: 14, marginBottom: 20 }}>
                        <span style={{ position: "relative", zIndex: 1, width: 36, height: 36, flex: "0 0 auto", padding: 8, borderRadius: "50%", background: "var(--paper)", border: "1px solid var(--border)", color: "var(--accent)", boxShadow: "var(--shadow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={19} />
                        </span>
                        <div style={{ flex: "1 1 auto", minWidth: 0, paddingTop: 6 }}>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                            <span style={{ fontSize: ".96rem", fontWeight: 600, letterSpacing: "-.01em", color: "var(--ink)", lineHeight: 1.35 }}>{activityTitle(row)}</span>
                            <span style={{ flex: "0 0 auto", fontFamily: "var(--mono)", fontSize: ".72rem", color: "var(--faint)" }}>{formatTimelineDate(row.date, todayIso)}</span>
                          </div>
                          <div style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: 3 }}>{activitySub(row)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </section>
      </div>
    </div>
  );
}
