const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email)) {
    return "Email không hợp lệ.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  }
  return null;
}

export function validateLoginForm({
  email,
  password,
}: {
  email: string;
  password: string;
}): { email?: string; password?: string } {
  const errors: { email?: string; password?: string } = {};
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  const pwErr = validatePassword(password);
  if (pwErr) errors.password = pwErr;
  return errors;
}

export function validateRegisterForm({
  name,
  email,
  password,
  confirm,
}: {
  name: string;
  email: string;
  password: string;
  confirm: string;
}): {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
} {
  const errors: {
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
  } = {};
  if (!name.trim()) {
    errors.name = "Vui lòng nhập tên.";
  }
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  const pwErr = validatePassword(password);
  if (pwErr) errors.password = pwErr;
  if (confirm !== password) {
    errors.confirm = "Mật khẩu xác nhận không khớp.";
  }
  return errors;
}