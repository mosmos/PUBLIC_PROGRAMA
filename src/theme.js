// Grayscale design system for Programa Wizard v2.
// No hues — only neutral values. Hierarchy comes from weight, size, and contrast.

export const C = {
  ink:       '#111111',  // near-black, headings and primary text
  text:      '#222222',  // body text
  textDim:   '#555555',  // secondary text
  mute:      '#888888',  // tertiary / meta
  line:      '#cccccc',  // borders
  lineSoft:  '#e5e5e5',  // subtle dividers
  hover:     '#f0f0f0',  // row hover
  panel:     '#f5f5f5',  // panel / inset background
  bg:        '#fafafa',  // page background
  surface:   '#ffffff',  // card surface
  // semantic flags (still grayscale — user asked monochrome)
  accent:    '#000000',  // emphasis (active tab, primary button)
  danger:    '#333333',  // delete actions use same ink, confirm by label
};

export const F = {
  base:   16,  // body
  small:  13,  // meta
  xs:     12,  // badges, labels
  large:  18,  // subheadings
  h2:     22,
  h1:     28,
  metric: 30,  // big numbers on cards
};

export const R = {
  sm: 4,
  md: 8,
  lg: 12,
};

export const FONT_FAMILY = "'Segoe UI', Arial, sans-serif";

// Standard button styles (primary = filled black, ghost = outlined)
export const btnPrimary = {
  padding: '10px 20px',
  borderRadius: R.md,
  border: '1px solid ' + C.accent,
  background: C.accent,
  color: C.surface,
  fontSize: F.base,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export const btnGhost = {
  padding: '10px 20px',
  borderRadius: R.md,
  border: '1px solid ' + C.line,
  background: C.surface,
  color: C.ink,
  fontSize: F.base,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

// Tooltip-ready "info" label: <span ... title="explanation">ℹ</span>
export const infoIcon = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  borderRadius: '50%',
  border: '1px solid ' + C.mute,
  color: C.textDim,
  fontSize: 11,
  fontWeight: 700,
  marginInlineStart: 6,
  cursor: 'help',
  background: C.surface,
};
