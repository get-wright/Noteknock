import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authInputStyle } from "../pages/authMotion";

type PasswordToggle = {
  show: boolean;
  onToggle: () => void;
  showLabel?: string;
  hideLabel?: string;
};

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  first?: boolean;
  passwordToggle?: PasswordToggle;
} & Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "placeholder" | "autoComplete" | "inputMode" | "name"
>;

export default function AuthInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error = "",
  autoComplete,
  inputMode,
  name,
  first = false,
  passwordToggle,
}: Props) {
  const hasError = !!error;
  const errorId = `${id}-error`;

  const resolvedType =
    passwordToggle && type === "password"
      ? passwordToggle.show
        ? "text"
        : "password"
      : type;

  const toggleAria =
    passwordToggle &&
    (passwordToggle.show
      ? (passwordToggle.hideLabel ?? "Ẩn mật khẩu")
      : (passwordToggle.showLabel ?? "Hiện mật khẩu"));

  return (
    <>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: ".86rem",
          fontWeight: 500,
          margin: first ? "0 0 8px" : "18px 0 8px",
        }}
      >
        {label}
      </label>
      <div style={{ position: passwordToggle ? "relative" : undefined }}>
        <input
          id={id}
          className="sm-in"
          type={resolvedType}
          inputMode={inputMode}
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          style={{
            ...authInputStyle(hasError),
            ...(passwordToggle ? { paddingRight: 52 } : {}),
          }}
        />
        {passwordToggle ? (
          <button
            type="button"
            aria-label={toggleAria}
            onClick={passwordToggle.onToggle}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              width: 38,
              height: 38,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "var(--muted)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {passwordToggle.show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        ) : null}
      </div>
      <div
        id={errorId}
        role="alert"
        style={{
          fontSize: ".82rem",
          color: "var(--rose)",
          marginTop: 8,
          display: hasError ? "block" : "none",
        }}
      >
        {error}
      </div>
    </>
  );
}