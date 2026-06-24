import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { AUTH_ORBS, authOrbMotion } from "../pages/authMotion";

const loginArtDesktop: CSSProperties = {
  flex: "0 0 44%",
  width: "44%",
  display: "flex",
  alignItems: "flex-end",
  padding: "48px",
  background: "linear-gradient(160deg,var(--accent) 0%,var(--accent-press) 100%)",
  position: "relative",
  overflow: "hidden",
};

const loginArtMobile: CSSProperties = {
  display: "none",
  width: 0,
  flex: "0 0 0",
};

type Props = {
  headline: string;
  subcopy: string;
  isDesktop: boolean;
  reduced: boolean;
};

export default function AuthArtPanel({
  headline,
  subcopy,
  isDesktop,
  reduced,
}: Props) {
  const loginArtStyle = isDesktop ? loginArtDesktop : loginArtMobile;

  return (
    <div style={loginArtStyle}>
      {isDesktop
        ? AUTH_ORBS.map((orb, i) => {
            const { animate, transition } = authOrbMotion(i, reduced);
            return (
              <motion.div
                key={i}
                className="sm-glass-orb"
                style={{
                  width: orb.w,
                  height: orb.h,
                  top: "top" in orb ? orb.top : undefined,
                  left: "left" in orb ? orb.left : undefined,
                  right: "right" in orb ? orb.right : undefined,
                  bottom: "bottom" in orb ? orb.bottom : undefined,
                }}
                animate={animate}
                transition={transition}
              />
            );
          })
        : null}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 380 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: ".74rem",
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#fff",
            opacity: 0.85,
            marginBottom: 22,
          }}
        >
          <Sparkles size={15} color="#fff" /> Sổ tay học tập
        </span>
        <h2
          style={{
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: "2.7rem",
            lineHeight: 1.1,
            letterSpacing: "-.02em",
            color: "#fff",
            margin: 0,
          }}
        >
          {headline}
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,.82)",
            fontSize: "1.05rem",
            lineHeight: 1.6,
            marginTop: 16,
            marginBottom: 0,
          }}
        >
          {subcopy}
        </p>
      </div>
    </div>
  );
}