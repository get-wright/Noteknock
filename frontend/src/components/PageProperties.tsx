import { useState, type KeyboardEvent } from "react";

export const SUBJECTS = {
  toan: { label: "Toán", color: "#E2725B" },
  ly: { label: "Lý", color: "#C98A2E" },
  anh: { label: "Tiếng Anh", color: "#5C9E6E" },
  hoa: { label: "Hóa", color: "#B5677F" },
} as const;

export const DIFF = {
  de: { label: "Dễ", color: "var(--green)", bg: "var(--green-soft)" },
  tb: { label: "Trung bình", color: "var(--amber)", bg: "var(--amber-soft)" },
  kho: { label: "Khó", color: "var(--rose)", bg: "var(--rose-soft)" },
} as const;

export const TAG_PALETTE = [
  "#D98F4E",
  "#7A9E5C",
  "#A0688E",
  "#C9772E",
  "#5E8AA0",
  "#C45B6B",
];

export type CustomTag = { id: string; label: string; color: string };

export type PagePropertiesProps = {
  subject: string | null;
  difficulty: string | null;
  customTags: CustomTag[];
  onSubjectChange: (subject: string | null) => void;
  onDifficultyChange: (difficulty: string | null) => void;
  onAddTag: (label: string) => void;
};

export function PageProperties({
  subject,
  difficulty,
  customTags,
  onSubjectChange,
  onDifficultyChange,
  onAddTag,
}: PagePropertiesProps) {
  const [newTag, setNewTag] = useState("");

  const builtIn = Object.entries(SUBJECTS).map(([id, s]) => ({
    id,
    label: s.label,
    color: s.color,
  }));
  const allSubjects: { id: string; label: string; color: string }[] = [
    ...builtIn,
    ...customTags.map((t) => ({ id: t.id, label: t.label, color: t.color })),
  ];

  const commitTag = () => {
    const v = newTag.trim();
    if (!v) {
      setNewTag("");
      return;
    }
    onAddTag(v);
    setNewTag("");
  };

  const onTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitTag();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        flexWrap: "wrap",
        marginBottom: 22,
      }}
    >
      {allSubjects.map((s) => {
        const on = subject === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSubjectChange(on ? null : s.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 38,
              padding: "0 14px",
              borderRadius: 99,
              cursor: "pointer",
              fontFamily: "var(--body)",
              fontSize: ".85rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
              border: `1px solid ${on ? "transparent" : "var(--border)"}`,
              background: on ? s.color : "var(--paper)",
              color: on ? "#fff" : "var(--muted)",
              transition: "all .16s ease",
            }}
          >
            <i
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: on ? "#fff" : s.color,
                display: "inline-block",
              }}
            />
            {s.label}
          </button>
        );
      })}

      <input
        className="sm-in"
        placeholder="+ Thẻ mới"
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onKeyDown={onTagKeyDown}
        style={{
          height: 38,
          padding: "0 14px",
          borderRadius: 99,
          border: "1px solid var(--border)",
          background: "var(--paper)",
          fontFamily: "var(--body)",
          fontSize: ".85rem",
          color: "var(--ink)",
          minWidth: 110,
        }}
      />

      <span
        style={{
          width: 1,
          height: 24,
          background: "var(--border)",
          margin: "0 4px",
        }}
      />

      {(Object.keys(DIFF) as Array<keyof typeof DIFF>).map((k) => {
        const d = DIFF[k];
        const on = difficulty === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onDifficultyChange(on ? null : k)}
            style={{
              height: 38,
              padding: "0 15px",
              borderRadius: 99,
              cursor: "pointer",
              fontFamily: "var(--body)",
              fontSize: ".84rem",
              fontWeight: 600,
              border: `1px solid ${on ? "transparent" : "var(--border)"}`,
              background: on ? d.bg : "transparent",
              color: on ? d.color : "var(--muted)",
              transition: "all .16s ease",
            }}
          >
            #{d.label}
          </button>
        );
      })}
    </div>
  );
}