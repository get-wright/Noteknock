import type { CSSProperties } from "react";
import type { Transition, Variants } from "motion/react";

export const PEEKY_EASE = [0.16, 1, 0.3, 1] as const;

export function authFormMotion(reduced: boolean): {
  container: Variants;
  item: Variants;
} {
  if (reduced) {
    return {
      container: { hidden: {}, show: {} },
      item: {
        hidden: { opacity: 1, y: 0 },
        show: { opacity: 1, y: 0 },
      },
    };
  }
  return {
    container: {
      hidden: {},
      show: {
        transition: { staggerChildren: 0.06, delayChildren: 0.08 },
      },
    },
    item: {
      hidden: { opacity: 0, y: 14 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: PEEKY_EASE },
      },
    },
  };
}

export const AUTH_ORBS = [
  { w: 200, h: 200, top: "8%", left: "-12%" },
  { w: 140, h: 140, top: "42%", right: "6%" },
  { w: 96, h: 96, bottom: "18%", left: "28%" },
] as const;

export function authOrbMotion(
  index: number,
  reduced: boolean,
): { animate: { y: number[]; scale: number[] } | undefined; transition: Transition | undefined } {
  if (reduced) {
    return { animate: undefined, transition: undefined };
  }
  return {
    animate: {
      y: [0, index % 2 === 0 ? -18 : 14, 0],
      scale: [1, 1.06, 1],
    },
    transition: {
      duration: 9 + index * 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };
}

export function authInputStyle(err: boolean): CSSProperties {
  return {
    width: "100%",
    height: 52,
    border: `1px solid ${err ? "var(--rose)" : "var(--border)"}`,
    borderRadius: 14,
    background: "var(--surface)",
    padding: "0 15px",
    fontFamily: "var(--body)",
    fontSize: "1rem",
    color: "var(--ink)",
    boxShadow: err ? "0 0 0 3px var(--rose-soft)" : "none",
    transition: "border-color .16s ease, box-shadow .16s ease",
  };
}
