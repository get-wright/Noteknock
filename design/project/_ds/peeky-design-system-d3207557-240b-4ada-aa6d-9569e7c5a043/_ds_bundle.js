/* @ds-bundle: {"format":3,"namespace":"PeekyDesignSystem_d32075","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"ShutterButton","sourcePath":"components/actions/ShutterButton.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"AvatarGroup","sourcePath":"components/display/AvatarGroup.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"ReactionPill","sourcePath":"components/display/ReactionPill.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"a6644071476f","components/actions/IconButton.jsx":"227f589e3fb8","components/actions/ShutterButton.jsx":"13703cb967fe","components/display/Avatar.jsx":"92ce0f331336","components/display/AvatarGroup.jsx":"711cd3025e94","components/display/Badge.jsx":"aa72797973f0","components/display/Card.jsx":"1df8f93f9d08","components/display/ReactionPill.jsx":"aef56836da2b","components/forms/Input.jsx":"2d43af4ada5d","components/forms/SegmentedControl.jsx":"f88dd0ca38da","components/forms/Switch.jsx":"468db49771f2","ui_kits/peeky_app/Capture.jsx":"5a4169cdb262","ui_kits/peeky_app/Feed.jsx":"2166d2e82b44","ui_kits/peeky_app/Friends.jsx":"8b4d243ddc51","ui_kits/peeky_app/Onboarding.jsx":"285ef33470ed","ui_kits/peeky_app/Settings.jsx":"1feb7510ecab","ui_kits/peeky_app/app.jsx":"42df779ccbb7","ui_kits/peeky_app/ios-frame.jsx":"be3343be4b51","ui_kits/peeky_app/kit-helpers.jsx":"14dd00bf303d"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PeekyDesignSystem_d32075 = window.PeekyDesignSystem_d32075 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Peeky Button — the primary action element.
 * Pill-shaped, warm, springy press feedback.
 */
function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  type = 'button',
  onClick,
  children,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '8px 16px',
      fontSize: 'var(--text-sm)',
      gap: '6px',
      minHeight: '36px'
    },
    md: {
      padding: '12px 22px',
      fontSize: 'var(--text-md)',
      gap: '8px',
      minHeight: '48px'
    },
    lg: {
      padding: '16px 28px',
      fontSize: 'var(--text-lg)',
      gap: '10px',
      minHeight: '56px'
    }
  };
  const variants = {
    primary: {
      background: 'var(--action-primary)',
      color: 'var(--text-on-coral)',
      boxShadow: 'var(--shadow-coral)'
    },
    ink: {
      background: 'var(--action-ink)',
      color: 'var(--text-on-ink)',
      boxShadow: 'var(--shadow-sm)'
    },
    secondary: {
      background: 'var(--surface-card)',
      color: 'var(--text-body)',
      boxShadow: 'var(--shadow-xs)',
      border: '1.5px solid var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-body)'
    }
  };
  const base = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--weight-semibold)',
    lineHeight: 1,
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'transform var(--duration-fast) var(--ease-spring), filter var(--duration-fast) var(--ease-out)',
    WebkitTapHighlightColor: 'transparent',
    ...sizes[size],
    ...variants[variant],
    ...style
  };
  const onDown = e => {
    if (!disabled) e.currentTarget.style.transform = 'scale(0.96)';
  };
  const onUp = e => {
    e.currentTarget.style.transform = 'scale(1)';
  };
  const onEnter = e => {
    if (!disabled) e.currentTarget.style.filter = 'brightness(0.96)';
  };
  const onLeave = e => {
    e.currentTarget.style.filter = 'none';
    e.currentTarget.style.transform = 'scale(1)';
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    style: base,
    onPointerDown: onDown,
    onPointerUp: onUp,
    onPointerEnter: onEnter,
    onPointerLeave: onLeave
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Peeky IconButton — a circular tappable icon target.
 * Always ≥44px for comfortable thumbs.
 */
function IconButton({
  variant = 'soft',
  size = 'md',
  disabled = false,
  label,
  onClick,
  children,
  style,
  ...rest
}) {
  const sizes = {
    sm: 40,
    md: 44,
    lg: 52
  };
  const dim = sizes[size];
  const variants = {
    soft: {
      background: 'var(--surface-card)',
      color: 'var(--text-body)',
      boxShadow: 'var(--shadow-sm)'
    },
    tint: {
      background: 'var(--action-primary-tint)',
      color: 'var(--coral-700)'
    },
    ink: {
      background: 'var(--action-ink)',
      color: 'var(--text-on-ink)'
    },
    primary: {
      background: 'var(--action-primary)',
      color: 'var(--text-on-coral)',
      boxShadow: 'var(--shadow-coral)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-body)'
    }
  };
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dim,
    height: dim,
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'transform var(--duration-fast) var(--ease-spring), filter var(--duration-fast) var(--ease-out)',
    WebkitTapHighlightColor: 'transparent',
    ...variants[variant],
    ...style
  };
  const onDown = e => {
    if (!disabled) e.currentTarget.style.transform = 'scale(0.9)';
  };
  const onUp = e => {
    e.currentTarget.style.transform = 'scale(1)';
  };
  const onLeave = e => {
    e.currentTarget.style.transform = 'scale(1)';
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    disabled: disabled,
    onClick: onClick,
    style: base,
    onPointerDown: onDown,
    onPointerUp: onUp,
    onPointerLeave: onLeave
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/actions/ShutterButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function useCss(id, css) {
  React.useEffect(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}
const CSS = `
.pk-shutter{position:relative;display:inline-grid;place-items:center;cursor:pointer;
  border:none;background:transparent;padding:0;border-radius:999px;
  transition:transform var(--dur-fast) var(--ease-spring);}
.pk-shutter:active{transform:scale(0.92);}
.pk-shutter:focus-visible{outline:none;}
.pk-shutter__halo{position:absolute;inset:0;border-radius:999px;
  box-shadow:0 0 0 6px var(--bg),0 0 0 11px var(--action);
  transition:box-shadow var(--dur-base) var(--ease-soft);}
.pk-shutter:focus-visible .pk-shutter__halo{box-shadow:0 0 0 6px var(--bg),0 0 0 11px var(--action),0 0 0 16px var(--focus-ring);}
.pk-shutter__core{border-radius:999px;background:var(--action);
  box-shadow:var(--shadow-coral);display:grid;place-items:center;color:var(--text-on-coral);
  transition:background var(--dur-fast) var(--ease-soft);}
.pk-shutter:hover .pk-shutter__core{background:var(--action-hover);}
.pk-shutter--busy .pk-shutter__core{background:var(--action-press);}
.pk-shutter[disabled]{opacity:.5;cursor:not-allowed;}
`;

/**
 * The Peeky capture button — a big coral shutter with a ring halo.
 * Central to the camera screen. Pass an icon via `icon` (defaults to a soft circle).
 */
function ShutterButton({
  size = 84,
  busy = false,
  icon = null,
  label = 'Chụp',
  disabled = false,
  className = '',
  ...rest
}) {
  useCss('pk-shutter-css', CSS);
  const core = Math.round(size * 0.82);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    disabled: disabled,
    className: ['pk-shutter', busy ? 'pk-shutter--busy' : '', className].filter(Boolean).join(' '),
    style: {
      width: size,
      height: size
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pk-shutter__halo"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pk-shutter__core",
    style: {
      width: core,
      height: core
    }
  }, icon));
}
Object.assign(__ds_scope, { ShutterButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/ShutterButton.jsx", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Peeky Avatar — round profile image or initials, with optional
 * coral "new moment" ring.
 */
function Avatar({
  src,
  name = '',
  size = 'md',
  ring = 'none',
  style,
  ...rest
}) {
  const sizes = {
    xs: 28,
    sm: 36,
    md: 48,
    lg: 64,
    xl: 88
  };
  const dim = sizes[size] || size;
  const rings = {
    none: 'transparent',
    coral: 'var(--coral-500)',
    sun: 'var(--sun-500)',
    seen: 'var(--cream-400)'
  };

  // Deterministic warm background from the name
  const warm = ['var(--coral-300)', 'var(--peach-500)', 'var(--sun-500)', 'var(--plum-300)', 'var(--coral-400)'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % warm.length;
  const initials = name.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const hasRing = ring !== 'none';
  const pad = hasRing ? 3 : 0;
  const outer = {
    display: 'inline-flex',
    padding: pad,
    borderRadius: '50%',
    background: rings[ring],
    ...style
  };
  const inner = {
    width: dim,
    height: dim,
    borderRadius: '50%',
    border: hasRing ? '2px solid var(--surface-app)' : 'none',
    background: src ? `center/cover no-repeat url(${src})` : warm[h],
    color: 'var(--plum-900)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--weight-semibold)',
    fontSize: dim * 0.38,
    overflow: 'hidden',
    flex: 'none'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: outer
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: inner
  }, !src && initials));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/AvatarGroup.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Peeky AvatarGroup — overlapping stack of avatars with optional +N.
 */
function AvatarGroup({
  people = [],
  size = 'md',
  max = 4,
  style,
  ...rest
}) {
  const sizes = {
    xs: 28,
    sm: 36,
    md: 48,
    lg: 64
  };
  const dim = sizes[size] || size;
  const overlap = Math.round(dim * 0.34);
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const ringStyle = {
    boxShadow: '0 0 0 2.5px var(--surface-app)',
    borderRadius: '50%'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      ...style
    }
  }, rest), shown.map((p, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      marginLeft: i === 0 ? 0 : -overlap,
      ...ringStyle,
      zIndex: shown.length - i
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    src: p.src,
    name: p.name,
    size: size
  }))), extra > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: -overlap,
      width: dim,
      height: dim,
      borderRadius: '50%',
      background: 'var(--plum-100)',
      color: 'var(--plum-700)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-body)',
      fontWeight: 'var(--weight-semibold)',
      fontSize: dim * 0.34,
      ...ringStyle
    }
  }, "+", extra));
}
Object.assign(__ds_scope, { AvatarGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/AvatarGroup.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Peeky Badge — small status / count pill.
 */
function Badge({
  tone = 'coral',
  variant = 'solid',
  size = 'md',
  children,
  style,
  ...rest
}) {
  const palette = {
    coral: {
      solid: ['var(--coral-500)', '#fff'],
      soft: ['var(--coral-100)', 'var(--coral-700)']
    },
    ink: {
      solid: ['var(--plum-800)', 'var(--cream-100)'],
      soft: ['var(--plum-100)', 'var(--plum-700)']
    },
    success: {
      solid: ['var(--green-500)', '#fff'],
      soft: ['var(--green-100)', 'var(--green-500)']
    },
    sun: {
      solid: ['var(--sun-500)', 'var(--plum-900)'],
      soft: ['var(--sun-200)', '#9A6712']
    },
    neutral: {
      solid: ['var(--plum-500)', '#fff'],
      soft: ['var(--cream-300)', 'var(--plum-700)']
    }
  };
  const [bg, fg] = palette[tone][variant];
  const sizes = {
    sm: {
      fontSize: '11px',
      padding: '2px 8px'
    },
    md: {
      fontSize: '12px',
      padding: '4px 11px'
    }
  };
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--weight-semibold)',
    lineHeight: 1.2,
    borderRadius: 'var(--radius-pill)',
    background: bg,
    color: fg,
    whiteSpace: 'nowrap',
    ...sizes[size],
    ...style
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: base
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Peeky Card — a soft white surface with pillowy corners.
 * The default container for moments, lists, and settings groups.
 */
function Card({
  tone = 'paper',
  padding = 'md',
  interactive = false,
  onClick,
  children,
  style,
  ...rest
}) {
  const pads = {
    none: '0',
    sm: 'var(--space-4)',
    md: 'var(--space-6)',
    lg: 'var(--space-7)'
  };
  const tones = {
    paper: {
      background: 'var(--surface-card)',
      color: 'var(--text-body)',
      boxShadow: 'var(--shadow-sm)'
    },
    sunken: {
      background: 'var(--surface-sunken)',
      color: 'var(--text-body)'
    },
    tint: {
      background: 'var(--surface-tint)',
      color: 'var(--coral-700)'
    },
    ink: {
      background: 'var(--surface-ink)',
      color: 'var(--text-on-ink)',
      boxShadow: 'var(--shadow-md)'
    }
  };
  const base = {
    borderRadius: 'var(--radius-xl)',
    padding: pads[padding],
    cursor: interactive ? 'pointer' : 'default',
    transition: 'transform var(--duration-base) var(--ease-spring), box-shadow var(--duration-base) var(--ease-out)',
    ...tones[tone],
    ...style
  };
  const onEnter = e => {
    if (interactive) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    }
  };
  const onLeave = e => {
    if (interactive) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = tones[tone].boxShadow || 'none';
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: base,
    onClick: onClick,
    onPointerEnter: onEnter,
    onPointerLeave: onLeave
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/ReactionPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Peeky ReactionPill — a quick-reaction chip shown under a moment.
 * Tap to react; shows the emoji and optional count.
 */
function ReactionPill({
  emoji = '💛',
  count,
  active = false,
  onClick,
  style,
  ...rest
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: count != null ? '7px 13px' : '8px',
    minHeight: '40px',
    minWidth: '40px',
    justifyContent: 'center',
    borderRadius: 'var(--radius-pill)',
    border: '1.5px solid ' + (active ? 'var(--coral-400)' : 'transparent'),
    background: active ? 'var(--coral-100)' : 'var(--surface-card)',
    boxShadow: active ? 'none' : 'var(--shadow-xs)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--text-body)',
    transition: 'transform var(--duration-fast) var(--ease-spring), background var(--duration-fast) var(--ease-out)',
    WebkitTapHighlightColor: 'transparent',
    ...style
  };
  const onDown = e => {
    e.currentTarget.style.transform = 'scale(1.12)';
  };
  const onUp = e => {
    e.currentTarget.style.transform = 'scale(1)';
  };
  const onLeave = e => {
    e.currentTarget.style.transform = 'scale(1)';
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    style: base,
    onPointerDown: onDown,
    onPointerUp: onUp,
    onPointerLeave: onLeave
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '18px',
      lineHeight: 1
    }
  }, emoji), count != null && /*#__PURE__*/React.createElement("span", null, count));
}
Object.assign(__ds_scope, { ReactionPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/ReactionPill.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Peeky Input — text field with label, helper, and error states.
 * Soft cream-card fill, coral focus ring.
 */
function Input({
  label,
  helper,
  error,
  iconLeft = null,
  size = 'md',
  type = 'text',
  id,
  style,
  ...rest
}) {
  const inputId = id || (label ? 'in-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const [focused, setFocused] = React.useState(false);
  const heights = {
    md: '52px',
    lg: '60px'
  };
  const wrap = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    height: heights[size],
    padding: '0 18px',
    background: 'var(--surface-card)',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid ' + (error ? 'var(--feedback-danger)' : focused ? 'var(--border-focus)' : 'var(--border-soft)'),
    boxShadow: focused && !error ? '0 0 0 4px var(--coral-100)' : 'none',
    transition: 'border-color var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out)'
  };
  const input = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-md)',
    color: 'var(--text-body)',
    minWidth: 0
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '7px',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-body)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: wrap
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)',
      display: 'inline-flex'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    style: input,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false)
  }, rest))), (helper || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: error ? 'var(--feedback-danger)' : 'var(--text-muted)'
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function useCss(id, css) {
  React.useEffect(() => {
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }, [id, css]);
}
const CSS = `
.pk-seg{display:inline-flex;background:var(--surface-2);border-radius:var(--radius-pill);
  padding:4px;gap:2px;font-family:var(--font-body);}
.pk-seg--full{display:flex;width:100%;}
.pk-seg__opt{flex:1;border:none;background:transparent;cursor:pointer;
  font-family:inherit;font-weight:var(--fw-semibold);font-size:var(--text-sm);
  color:var(--text-muted);padding:8px 18px;border-radius:var(--radius-pill);white-space:nowrap;
  transition:color var(--dur-fast) var(--ease-soft),background var(--dur-base) var(--ease-soft),box-shadow var(--dur-base) var(--ease-soft);}
.pk-seg__opt:focus-visible{outline:none;box-shadow:0 0 0 3px var(--focus-ring);}
.pk-seg__opt--active{background:var(--bg-card);color:var(--text-strong);box-shadow:var(--shadow-sm);}
`;

/**
 * Segmented control / pill tabs. options: [{value,label}] or string[].
 */
function SegmentedControl({
  options = [],
  value,
  onChange,
  fullWidth = false,
  className = '',
  ...rest
}) {
  useCss('pk-seg-css', CSS);
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['pk-seg', fullWidth ? 'pk-seg--full' : '', className].filter(Boolean).join(' '),
    role: "tablist"
  }, rest), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "tab",
    "aria-selected": value === o.value,
    className: ['pk-seg__opt', value === o.value ? 'pk-seg__opt--active' : ''].filter(Boolean).join(' '),
    onClick: () => onChange && onChange(o.value)
  }, o.label)));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Peeky Switch — a friendly pill toggle. Coral when on.
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  style,
  ...rest
}) {
  const switchId = id || (label ? 'sw-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const track = {
    position: 'relative',
    width: '52px',
    height: '30px',
    borderRadius: 'var(--radius-pill)',
    background: checked ? 'var(--action-primary)' : 'var(--cream-400)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background var(--duration-base) var(--ease-out)',
    border: 'none',
    padding: 0,
    flex: 'none'
  };
  const knob = {
    position: 'absolute',
    top: '3px',
    left: checked ? '25px' : '3px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#FFFFFF',
    boxShadow: 'var(--shadow-sm)',
    transition: 'left var(--duration-base) var(--ease-spring)'
  };
  const toggle = () => {
    if (!disabled && onChange) onChange(!checked);
  };
  const control = /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": checked,
    id: switchId,
    disabled: disabled,
    onClick: toggle,
    style: track
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: knob
  }));
  if (!label) return control;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: switchId,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-md)',
      color: 'var(--text-body)'
    }
  }, label), control);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// ui_kits/peeky_app/Capture.jsx
try { (() => {
// Peeky — Capture / camera home (the hero screen)
function Capture({
  onOpenFriends,
  onOpenSettings,
  onOpenFeed,
  onSend
}) {
  const {
    Avatar,
    IconButton
  } = window.PeekyDesignSystem_d32075;
  useLucide();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-app)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '62px 18px 14px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onOpenSettings,
    style: {
      border: 'none',
      background: 'none',
      padding: 0,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Linh",
    size: "md"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onOpenFriends,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      border: 'none',
      cursor: 'pointer',
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-sm)',
      borderRadius: 'var(--radius-pill)',
      padding: '9px 16px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "users",
    s: 17,
    color: "var(--coral-500)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 15,
      color: 'var(--text-body)'
    }
  }, "Gia \u0111\xECnh m\xECnh"), /*#__PURE__*/React.createElement(Icon, {
    n: "chevron-down",
    s: 16,
    color: "var(--text-faint)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "soft",
    label: "B\u1EA1n b\xE8",
    onClick: onOpenFriends
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "user-plus",
    s: 20
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -3,
      right: -3,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: 'var(--coral-500)',
      color: '#fff',
      fontSize: 11,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid var(--surface-app)'
    }
  }, "1"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 18px 0',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    seed: "peeky-cam",
    radius: "34px"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      bottom: 22,
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      background: 'rgba(45,27,53,0.5)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: 'var(--radius-pill)',
      padding: '9px 18px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "pen-line",
    s: 15,
    color: "rgba(255,255,255,0.9)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14.5,
      fontWeight: 500,
      color: '#fff'
    }
  }, "Th\xEAm ch\xFA th\xEDch\u2026"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 36px'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "ghost",
    size: "lg",
    label: "Th\u01B0 vi\u1EC7n"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "images",
    s: 26,
    color: "var(--plum-500)"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onSend,
    "aria-label": "Ch\u1EE5p",
    style: {
      width: 84,
      height: 84,
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      background: 'var(--coral-500)',
      boxShadow: 'var(--shadow-coral)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      outline: '5px solid var(--surface-app)',
      outlineOffset: '4px',
      transition: 'transform var(--duration-fast) var(--ease-spring)'
    },
    onPointerDown: e => e.currentTarget.style.transform = 'scale(0.92)',
    onPointerUp: e => e.currentTarget.style.transform = 'scale(1)',
    onPointerLeave: e => e.currentTarget.style.transform = 'scale(1)'
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      border: '3px solid rgba(255,255,255,0.85)'
    }
  })), /*#__PURE__*/React.createElement(IconButton, {
    variant: "ghost",
    size: "lg",
    label: "\u0110\u1ED5i camera"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "refresh-cw",
    s: 24,
    color: "var(--plum-500)"
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: onOpenFeed,
    style: {
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      padding: '0 0 30px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "chevron-up",
    s: 22,
    color: "var(--text-faint)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, "Kho\u1EA3nh kh\u1EAFc c\u1EE7a m\u1ECDi ng\u01B0\u1EDDi")));
}
Object.assign(window, {
  Capture
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/peeky_app/Capture.jsx", error: String((e && e.message) || e) }); }

// ui_kits/peeky_app/Feed.jsx
try { (() => {
// Peeky — Feed / received moments (Locket-style single moment view)
function Feed({
  onClose
}) {
  const {
    Avatar,
    IconButton,
    ReactionPill,
    Badge
  } = window.PeekyDesignSystem_d32075;
  const [idx, setIdx] = React.useState(0);
  useLucide();
  const m = PEEKY.moments[idx];
  const friend = PEEKY.friends.find(f => f.name === m.who) || {
    ring: 'coral'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-app)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '62px 16px 14px'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "soft",
    label: "\u0110\xF3ng",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "chevron-down",
    s: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: m.who,
    size: "sm",
    ring: friend.ring
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 15.5,
      color: 'var(--text-strong)'
    }
  }, m.who), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, m.time, " tr\u01B0\u1EDBc"))), /*#__PURE__*/React.createElement(IconButton, {
    variant: "ghost",
    label: "Th\xEAm"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "more-horizontal",
    s: 22,
    color: "var(--plum-500)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 18px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    seed: m.seed,
    radius: "34px"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 30,
      right: 30,
      bottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-block',
      background: 'rgba(45,27,53,0.55)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: 'var(--radius-lg)',
      padding: '11px 16px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      fontWeight: 500,
      color: '#fff',
      lineHeight: 1.35
    }
  }, m.cap)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      justifyContent: 'center',
      padding: '16px 0 6px'
    }
  }, PEEKY.moments.map((_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setIdx(i),
    style: {
      width: i === idx ? 22 : 7,
      height: 7,
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      background: i === idx ? 'var(--coral-500)' : 'var(--cream-400)',
      transition: 'all var(--duration-base) var(--ease-out)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      justifyContent: 'center',
      padding: '8px 18px'
    }
  }, m.reacts.map(([e, c, active], i) => /*#__PURE__*/React.createElement(ReactionPill, {
    key: i,
    emoji: e,
    count: c,
    active: active
  })), /*#__PURE__*/React.createElement(ReactionPill, {
    emoji: "\u2795"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      padding: '12px 18px 30px',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'var(--surface-card)',
      boxShadow: 'var(--shadow-sm)',
      borderRadius: 'var(--radius-pill)',
      padding: '13px 20px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 15.5,
      color: 'var(--text-faint)'
    }
  }, "Tr\u1EA3 l\u1EDDi ", m.who, "\u2026")), /*#__PURE__*/React.createElement(IconButton, {
    variant: "primary",
    label: "G\u1EEDi"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "send",
    s: 20,
    color: "#fff"
  }))));
}
Object.assign(window, {
  Feed
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/peeky_app/Feed.jsx", error: String((e && e.message) || e) }); }

// ui_kits/peeky_app/Friends.jsx
try { (() => {
// Peeky — Friends / circle management
function Friends({
  onClose
}) {
  const {
    Avatar,
    IconButton,
    Button,
    Card,
    Badge,
    Input
  } = window.PeekyDesignSystem_d32075;
  useLucide();
  const Row = ({
    f
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '12px 0'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: f.name,
    size: "md",
    ring: f.ring
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      lineHeight: 1.3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 16,
      color: 'var(--text-strong)'
    }
  }, f.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13.5,
      color: 'var(--text-muted)'
    }
  }, f.sub)), /*#__PURE__*/React.createElement(IconButton, {
    variant: "ghost",
    label: "Th\xEAm"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "more-horizontal",
    s: 20,
    color: "var(--plum-400)"
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-app)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '62px 16px 8px'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "soft",
    label: "Quay l\u1EA1i",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "arrow-left",
    s: 20
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      margin: 0,
      flex: 1
    }
  }, "V\xF2ng tr\xF2n"), /*#__PURE__*/React.createElement(Badge, {
    tone: "coral"
  }, PEEKY.friends.length, " ng\u01B0\u1EDDi")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '8px 20px 30px'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "T\xECm ho\u1EB7c th\xEAm b\u1EB1ng s\u1ED1 \u0111i\u1EC7n tho\u1EA1i",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      n: "search",
      s: 18,
      color: "var(--text-faint)"
    }),
    style: {
      marginBottom: 18
    }
  }), /*#__PURE__*/React.createElement(Card, {
    tone: "tint",
    padding: "md",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: '50%',
      background: 'var(--coral-500)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "share-2",
    s: 22,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      lineHeight: 1.3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 15.5,
      color: 'var(--plum-800)'
    }
  }, "M\u1EDDi ng\u01B0\u1EDDi th\xE2n"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13.5,
      color: 'var(--coral-700)'
    }
  }, "Chia s\u1EBB link m\u1EDDi c\u1EE7a b\u1EA1n")), /*#__PURE__*/React.createElement(Icon, {
    n: "chevron-right",
    s: 20,
    color: "var(--coral-600)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "peeky-eyebrow",
    style: {
      marginBottom: 6
    }
  }, "L\u1EDDi m\u1EDDi"), PEEKY.requests.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '12px 0'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: r.name,
    size: "md"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      lineHeight: 1.3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 16,
      color: 'var(--text-strong)'
    }
  }, r.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13.5,
      color: 'var(--text-muted)'
    }
  }, r.mutual)), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm"
  }, "Ch\u1EA5p nh\u1EADn"))), /*#__PURE__*/React.createElement("div", {
    className: "peeky-eyebrow",
    style: {
      margin: '18px 0 2px'
    }
  }, "Trong v\xF2ng tr\xF2n"), PEEKY.friends.map((f, i) => /*#__PURE__*/React.createElement(Row, {
    key: i,
    f: f
  }))));
}
Object.assign(window, {
  Friends
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/peeky_app/Friends.jsx", error: String((e && e.message) || e) }); }

// ui_kits/peeky_app/Onboarding.jsx
try { (() => {
// Peeky — Onboarding / welcome screen
function Onboarding({
  onStart
}) {
  const {
    Button,
    Input
  } = window.PeekyDesignSystem_d32075;
  useLucide();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-app)',
      padding: '0 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: 22,
      paddingTop: 40
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/peeky-mark.svg",
    alt: "Peeky",
    style: {
      width: 76,
      height: 76
    }
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 44,
      lineHeight: 1.04,
      letterSpacing: '-0.02em',
      color: 'var(--text-strong)',
      margin: 0
    }
  }, "Kho\u1EA3nh kh\u1EAFc ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontStyle: 'italic',
      color: 'var(--coral-500)'
    }
  }, "th\u1EADt"), ",", /*#__PURE__*/React.createElement("br", null), "cho ng\u01B0\u1EDDi m\xECnh th\u01B0\u01A1ng"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.55,
      color: 'var(--text-muted)',
      margin: 0,
      maxWidth: 320
    }
  }, "Ch\u1EE5p m\u1ED9t t\u1EA5m h\xECnh, g\u1EEDi th\u1EB3ng l\xEAn m\xE0n h\xECnh ch\u1EDD c\u1EE7a ng\u01B0\u1EDDi th\xE2n. Kh\xF4ng filter, kh\xF4ng c\xF4ng khai.")), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 40,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "lg",
    placeholder: "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i c\u1EE7a b\u1EA1n",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      n: "phone",
      s: 18,
      color: "var(--text-faint)"
    }),
    defaultValue: ""
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onStart,
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      n: "arrow-right",
      s: 20,
      color: "#fff"
    })
  }, "B\u1EAFt \u0111\u1EA7u"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-faint)',
      textAlign: 'center',
      margin: '4px 0 0',
      lineHeight: 1.5
    }
  }, "Ti\u1EBFp t\u1EE5c ngh\u0129a l\xE0 b\u1EA1n \u0111\u1ED3ng \xFD v\u1EDBi \u0110i\u1EC1u kho\u1EA3n & Quy\u1EC1n ri\xEAng t\u01B0 c\u1EE7a Peeky")));
}
Object.assign(window, {
  Onboarding
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/peeky_app/Onboarding.jsx", error: String((e && e.message) || e) }); }

// ui_kits/peeky_app/Settings.jsx
try { (() => {
// Peeky — Settings + lock-screen widget preview
function Settings({
  onClose
}) {
  const {
    Avatar,
    IconButton,
    Switch,
    Card,
    Badge
  } = window.PeekyDesignSystem_d32075;
  const [a, setA] = React.useState(true);
  const [b, setB] = React.useState(true);
  const [c, setC] = React.useState(false);
  useLucide();
  const SettingRow = ({
    icon,
    label,
    children,
    last
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '15px 0',
      borderBottom: last ? 'none' : '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 'var(--radius-sm)',
      background: 'var(--coral-100)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: icon,
    s: 18,
    color: "var(--coral-600)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      color: 'var(--text-body)'
    }
  }, label), children);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-app)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '62px 16px 8px'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "soft",
    label: "Quay l\u1EA1i",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "arrow-left",
    s: 20
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 24,
      margin: 0
    }
  }, "H\u1ED3 s\u01A1")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '12px 20px 30px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      padding: '8px 0 22px'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Linh",
    size: "xl",
    ring: "coral"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      lineHeight: 1.3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 24,
      color: 'var(--text-strong)'
    }
  }, "Linh"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, "@linh \xB7 5 ng\u01B0\u1EDDi th\xE2n"))), /*#__PURE__*/React.createElement("div", {
    className: "peeky-eyebrow",
    style: {
      marginBottom: 8
    }
  }, "Widget m\xE0n h\xECnh ch\u1EDD"), /*#__PURE__*/React.createElement(Card, {
    tone: "ink",
    padding: "lg",
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 92,
      height: 92,
      borderRadius: 20,
      overflow: 'hidden',
      flex: 'none',
      boxShadow: '0 6px 18px rgba(0,0,0,0.3)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://picsum.photos/seed/m-coffee/200/200",
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 15,
      color: 'var(--cream-100)'
    }
  }, "M\u1EB9 v\u1EEBa g\u1EEDi"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13.5,
      color: 'var(--plum-200)',
      marginTop: 2
    }
  }, "Hi\u1EC7n ngay tr\xEAn m\xE0n h\xECnh ch\u1EDD c\u1EE7a b\u1EA1n \u2014 ch\u1EA1m \u0111\u1EC3 m\u1EDF.")))), /*#__PURE__*/React.createElement("div", {
    className: "peeky-eyebrow",
    style: {
      marginBottom: 4
    }
  }, "C\xE0i \u0111\u1EB7t"), /*#__PURE__*/React.createElement(SettingRow, {
    icon: "bell",
    label: "Th\xF4ng b\xE1o kho\u1EA3nh kh\u1EAFc m\u1EDBi"
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: a,
    onChange: setA
  })), /*#__PURE__*/React.createElement(SettingRow, {
    icon: "layout-grid",
    label: "Hi\u1EC7n tr\xEAn widget"
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: b,
    onChange: setB
  })), /*#__PURE__*/React.createElement(SettingRow, {
    icon: "moon",
    label: "Gi\u1EDD y\xEAn t\u0129nh"
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: c,
    onChange: setC
  })), /*#__PURE__*/React.createElement(SettingRow, {
    icon: "lock",
    label: "Quy\u1EC1n ri\xEAng t\u01B0",
    last: true
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "chevron-right",
    s: 20,
    color: "var(--text-faint)"
  }))));
}
Object.assign(window, {
  Settings
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/peeky_app/Settings.jsx", error: String((e && e.message) || e) }); }

// ui_kits/peeky_app/app.jsx
try { (() => {
// Peeky — app shell: screen routing + sent toast
function PeekyApp() {
  const [screen, setScreen] = React.useState('onboarding');
  const [toast, setToast] = React.useState(false);
  useLucide();
  const go = s => setScreen(s);
  const send = () => {
    setToast(true);
    window.setTimeout(() => setToast(false), 2200);
  };
  let view;
  if (screen === 'onboarding') view = /*#__PURE__*/React.createElement(Onboarding, {
    onStart: () => go('capture')
  });else if (screen === 'capture') view = /*#__PURE__*/React.createElement(Capture, {
    onOpenFriends: () => go('friends'),
    onOpenSettings: () => go('settings'),
    onOpenFeed: () => go('feed'),
    onSend: send
  });else if (screen === 'feed') view = /*#__PURE__*/React.createElement(Feed, {
    onClose: () => go('capture')
  });else if (screen === 'friends') view = /*#__PURE__*/React.createElement(Friends, {
    onClose: () => go('capture')
  });else if (screen === 'settings') view = /*#__PURE__*/React.createElement(Settings, {
    onClose: () => go('capture')
  });
  return /*#__PURE__*/React.createElement(IOSDevice, null, /*#__PURE__*/React.createElement("div", {
    key: screen,
    style: {
      height: '100%',
      animation: 'peekyFade 360ms cubic-bezier(0.22,1,0.36,1)'
    }
  }, view), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      bottom: 120,
      transform: 'translateX(-50%)',
      zIndex: 80,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'var(--plum-800)',
      color: 'var(--cream-100)',
      borderRadius: 'var(--radius-pill)',
      padding: '13px 22px',
      boxShadow: 'var(--shadow-xl)',
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      fontSize: 15.5,
      animation: 'peekyPop 360ms cubic-bezier(0.34,1.56,0.64,1)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, "\uD83D\uDC9B"), " \u0110\xE3 g\u1EEDi t\u1EDBi Gia \u0111\xECnh m\xECnh"));
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(/*#__PURE__*/React.createElement(PeekyApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/peeky_app/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/peeky_app/ios-frame.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// iOS.jsx — Simplified iOS 26 (Liquid Glass) device frame
// Based on the iOS 26 UI Kit + Figma status bar spec. No assets, no deps.
// Exports (to window): IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard
//
// Usage — wrap your screen content in <IOSDevice> to get the bezel, status bar
// and home indicator (props: title, dark, keyboard):
//
//   <IOSDevice title="Settings">
//     ...your screen content...
//   </IOSDevice>
//   <IOSDevice dark title="Search" keyboard>…</IOSDevice>
/* END USAGE */

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function IOSStatusBar({
  dark = false,
  time = '9:41'
}) {
  const c = dark ? '#fff' : '#000';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 154,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '21px 24px 19px',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 20,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: '-apple-system, "SF Pro", system-ui',
      fontWeight: 590,
      fontSize: 17,
      lineHeight: '22px',
      color: c
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingTop: 1,
      paddingRight: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "12",
    viewBox: "0 0 19 12"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "7.5",
    width: "3.2",
    height: "4.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.8",
    y: "5",
    width: "3.2",
    height: "7",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9.6",
    y: "2.5",
    width: "3.2",
    height: "9.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14.4",
    y: "0",
    width: "3.2",
    height: "12",
    rx: "0.7",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "12",
    viewBox: "0 0 17 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10.5",
    r: "1.5",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "27",
    height: "13",
    viewBox: "0 0 27 13"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "23",
    height: "12",
    rx: "3.5",
    stroke: c,
    strokeOpacity: "0.35",
    fill: "none"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "20",
    height: "9",
    rx: "2",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z",
    fill: c,
    fillOpacity: "0.4"
  }))));
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
function IOSGlassPill({
  children,
  dark = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      minWidth: 44,
      borderRadius: 9999,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark ? '0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.28)' : 'rgba(255,255,255,0.5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
function IOSNavBar({
  title = 'Title',
  dark = false,
  trailingIcon = true
}) {
  const muted = dark ? 'rgba(255,255,255,0.6)' : '#404040';
  const text = dark ? '#fff' : '#000';
  const pillIcon = content => /*#__PURE__*/React.createElement(IOSGlassPill, {
    dark: dark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, content));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingTop: 62,
      paddingBottom: 10,
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }
  }, pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "20",
    viewBox: "0 0 12 20",
    fill: "none",
    style: {
      marginLeft: -1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2L2 10l8 8",
    stroke: muted,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), trailingIcon && pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "6",
    viewBox: "0 0 22 6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "3",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "3",
    r: "2.5",
    fill: muted
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px',
      fontFamily: '-apple-system, system-ui',
      fontSize: 34,
      fontWeight: 700,
      lineHeight: '41px',
      color: text,
      letterSpacing: 0.4
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
function IOSListRow({
  title,
  detail,
  icon,
  chevron = true,
  isLast = false,
  dark = false
}) {
  const text = dark ? '#fff' : '#000';
  const sec = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const ter = dark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)';
  const sep = dark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.12)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      minHeight: 52,
      padding: '0 16px',
      position: 'relative',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      letterSpacing: -0.43
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 7,
      background: icon,
      marginRight: 12,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      color: text
    }
  }, title), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sec,
      marginRight: 6
    }
  }, detail), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "14",
    viewBox: "0 0 8 14",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l6 6-6 6",
    stroke: ter,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), !isLast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: icon ? 58 : 16,
      height: 0.5,
      background: sep
    }
  }));
}
function IOSList({
  header,
  children,
  dark = false
}) {
  const hc = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const bg = dark ? '#1C1C1E' : '#fff';
  return /*#__PURE__*/React.createElement("div", null, header && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '-apple-system, system-ui',
      fontSize: 13,
      color: hc,
      textTransform: 'uppercase',
      padding: '8px 36px 6px',
      letterSpacing: -0.08
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      borderRadius: 26,
      margin: '0 16px',
      overflow: 'hidden'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Device frame
// ─────────────────────────────────────────────────────────────
function IOSDevice({
  children,
  width = 402,
  height = 874,
  dark = false,
  title,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 48,
      overflow: 'hidden',
      position: 'relative',
      background: dark ? '#000' : '#F2F2F7',
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: '-apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 126,
      height: 37,
      borderRadius: 24,
      background: '#000',
      zIndex: 50
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement(IOSStatusBar, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, title !== undefined && /*#__PURE__*/React.createElement(IOSNavBar, {
    title: title,
    dark: dark
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(IOSKeyboard, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      height: 34,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingBottom: 8,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 139,
      height: 5,
      borderRadius: 100,
      background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'
    }
  })));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — iOS 26 liquid glass
// ─────────────────────────────────────────────────────────────
function IOSKeyboard({
  dark = false
}) {
  const glyph = dark ? 'rgba(255,255,255,0.7)' : '#595959';
  const sugg = dark ? 'rgba(255,255,255,0.6)' : '#333';
  const keyBg = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)';

  // special-key icons
  const icons = {
    shift: /*#__PURE__*/React.createElement("svg", {
      width: "19",
      height: "17",
      viewBox: "0 0 19 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9.5 1L1 9.5h4.5V16h8V9.5H18L9.5 1z",
      fill: glyph
    })),
    del: /*#__PURE__*/React.createElement("svg", {
      width: "23",
      height: "17",
      viewBox: "0 0 23 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M7 1h13a2 2 0 012 2v11a2 2 0 01-2 2H7l-6-7.5L7 1z",
      fill: "none",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 5l7 7M17 5l-7 7",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinecap: "round"
    })),
    ret: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "14",
      viewBox: "0 0 20 14"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M18 1v6H4m0 0l4-4M4 7l4 4",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))
  };
  const key = (content, {
    w,
    flex,
    ret,
    fs = 25,
    k
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 42,
      borderRadius: 8.5,
      flex: flex ? 1 : undefined,
      width: w,
      minWidth: 0,
      background: ret ? '#08f' : keyBg,
      boxShadow: '0 1px 0 rgba(0,0,0,0.075)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, "SF Compact", system-ui',
      fontSize: fs,
      fontWeight: 458,
      color: ret ? '#fff' : glyph
    }
  }, content);
  const row = (keys, pad = 0) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      justifyContent: 'center',
      padding: `0 ${pad}px`
    }
  }, keys.map(l => key(l, {
    flex: true,
    k: l
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 15,
      borderRadius: 27,
      overflow: 'hidden',
      padding: '11px 0 2px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: dark ? '0 -2px 20px rgba(0,0,0,0.09)' : '0 -1px 6px rgba(0,0,0,0.018), 0 -3px 20px rgba(0,0,0,0.012)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.14)' : 'rgba(255,255,255,0.25)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      padding: '8px 22px 13px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, ['"The"', 'the', 'to'].map((w, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 25,
      background: '#ccc',
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      color: sugg,
      letterSpacing: -0.43,
      lineHeight: '22px'
    }
  }, w)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      padding: '0 6.5px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], 20), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14.25,
      alignItems: 'center'
    }
  }, key(icons.shift, {
    w: 45,
    k: 'shift'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      flex: 1
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l, {
    flex: true,
    k: l
  }))), key(icons.del, {
    w: 45,
    k: 'del'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, key('ABC', {
    w: 92.25,
    fs: 18,
    k: 'abc'
  }), key('', {
    flex: true,
    k: 'space'
  }), key(icons.ret, {
    w: 92.25,
    ret: true,
    k: 'ret'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      width: '100%',
      position: 'relative'
    }
  }));
}
Object.assign(window, {
  IOSDevice,
  IOSStatusBar,
  IOSNavBar,
  IOSGlassPill,
  IOSList,
  IOSListRow,
  IOSKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/peeky_app/ios-frame.jsx", error: String((e && e.message) || e) }); }

// ui_kits/peeky_app/kit-helpers.jsx
try { (() => {
// Peeky UI Kit — shared helpers & fake data
// Loaded before the screens. Exposes globals via window.

// Lucide icon helper — renders an <i data-lucide> that createIcons() upgrades.
function Icon({
  n,
  s = 24,
  color,
  style
}) {
  return /*#__PURE__*/React.createElement("i", {
    "data-lucide": n,
    style: {
      width: s,
      height: s,
      display: 'inline-flex',
      color,
      strokeWidth: 2,
      ...style
    }
  });
}

// Re-run lucide after every render so dynamically added icons upgrade.
function useLucide() {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}

// A "photo" — real placeholder imagery (Lorem Picsum) with a soft warm overlay
// so it sits inside the brand. Square by default.
function Photo({
  seed,
  radius = 'var(--radius-xl)',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      aspectRatio: '1 / 1',
      borderRadius: radius,
      overflow: 'hidden',
      background: 'var(--cream-300)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: `https://picsum.photos/seed/${seed}/640/640`,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(45,27,53,0) 55%, rgba(45,27,53,0.22) 100%)',
      mixBlendMode: 'multiply'
    }
  }));
}
const PEEKY = {
  me: {
    name: 'Linh',
    circle: 'Gia đình mình'
  },
  friends: [{
    name: 'Mẹ',
    seed: 'mom',
    ring: 'coral',
    sub: 'Vừa gửi · 2 phút'
  }, {
    name: 'Khoa',
    seed: 'khoa',
    ring: 'sun',
    sub: '🔥 12 ngày'
  }, {
    name: 'Vy',
    seed: 'vy',
    ring: 'seen',
    sub: 'Đã xem khoảnh khắc của bạn'
  }, {
    name: 'Bình Minh',
    seed: 'binh',
    ring: 'none',
    sub: 'Online'
  }, {
    name: 'An',
    seed: 'an',
    ring: 'none',
    sub: '2 giờ trước'
  }],
  requests: [{
    name: 'Thảo Nguyên',
    seed: 'thao',
    mutual: '3 bạn chung'
  }],
  moments: [{
    id: 1,
    who: 'Mẹ',
    seed: 'm-coffee',
    cap: 'Cà phê sáng nhớ con 💛',
    time: '2 phút',
    reacts: [['💛', 2, true], ['🥹', 1, false]]
  }, {
    id: 2,
    who: 'Khoa',
    seed: 'm-beach',
    cap: 'Biển chiều nay đẹp dã man',
    time: '1 giờ',
    reacts: [['😍', 3, false], ['🔥', 1, false]]
  }, {
    id: 3,
    who: 'Vy',
    seed: 'm-cat',
    cap: 'Bé mèo nhà mình nè',
    time: '3 giờ',
    reacts: [['😂', 4, true]]
  }]
};
Object.assign(window, {
  Icon,
  useLucide,
  Photo,
  PEEKY
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/peeky_app/kit-helpers.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.ShutterButton = __ds_scope.ShutterButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarGroup = __ds_scope.AvatarGroup;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ReactionPill = __ds_scope.ReactionPill;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Switch = __ds_scope.Switch;

})();
