/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* ── Brand Core ── */
        "primary":                   "#54b435",   /* Mandtech Green */
        "primary-dark":              "#3d8a27",   /* Darker green shade */
        "primary-light":             "#78c95d",   /* Lighter green shade */
        "on-primary":                "#ffffff",
        "primary-container":         "#d6f0cd",   /* Very light green tint */
        "on-primary-container":      "#1a4d0e",
        "primary-fixed":             "#eaf7e5",   /* Palest green wash */
        "primary-fixed-dim":         "#b8e6a8",
        "on-primary-fixed":          "#0e2f07",
        "on-primary-fixed-variant":  "#2d7019",
        "inverse-primary":           "#78c95d",

        /* ── Neutral / Surface (black → white scale) ── */
        "deep-charcoal":             "#000000",   /* Pure black sidebar */
        "on-surface":                "#0d0d0d",
        "on-background":             "#0d0d0d",
        "inverse-surface":           "#1a1a1a",
        "inverse-on-surface":        "#f2f2f2",
        "surface":                   "#f8faf8",   /* Very slight green-tinted white */
        "surface-white":             "#ffffff",
        "surface-bright":            "#ffffff",
        "surface-dim":               "#dde3dd",
        "surface-variant":           "#ced6ce",
        "surface-container-lowest":  "#ffffff",
        "surface-container-low":     "#f0f5f0",
        "surface-container":         "#e8efe8",
        "surface-container-high":    "#dde6dd",
        "surface-container-highest": "#d2ddd2",
        "surface-tint":              "#54b435",

        /* ── Secondary (dark grey from black palette) ── */
        "secondary":                 "#4a4a4a",
        "on-secondary":              "#ffffff",
        "secondary-container":       "#e0e0e0",
        "on-secondary-container":    "#5c5c5c",
        "secondary-fixed":           "#e0e0e0",
        "secondary-fixed-dim":       "#bfbfbf",
        "on-secondary-fixed":        "#1a1a1a",
        "on-secondary-fixed-variant":"#404040",

        /* ── Tertiary (deeper green variant) ── */
        "tertiary":                  "#2e7d1f",
        "on-tertiary":               "#ffffff",
        "tertiary-container":        "#b3e6a0",
        "on-tertiary-container":     "#0a3205",
        "tertiary-fixed":            "#c8f0b8",
        "tertiary-fixed-dim":        "#96d882",
        "on-tertiary-fixed":         "#062803",
        "on-tertiary-fixed-variant": "#1e5c14",

        /* ── Outline / Borders ── */
        "outline":                   "#6b7a6b",
        "outline-variant":           "#c0ccb8",

        /* ── Error ── */
        "error":                     "#ba1a1a",
        "on-error":                  "#ffffff",
        "error-container":           "#ffdad6",
        "on-error-container":        "#93000a",

        /* ── Misc ── */
        "status-gray":               "#6c757d",
        "background":                "#f8faf8",
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "9999px"
      },
      spacing: {
        "gutter": "24px",
        "base": "8px",
        "margin-mobile": "16px",
        "margin-desktop": "64px",
        "container-max": "1280px"
      },
      fontFamily: {
        "body-sm": ["Inter"],
        "body-md": ["Inter"],
        "headline-xl": ["Hanken Grotesk"],
        "button": ["Inter"],
        "headline-lg": ["Hanken Grotesk"],
        "label-bold": ["Inter"],
        "headline-md": ["Hanken Grotesk"],
        "body-lg": ["Inter"]
      },
      fontSize: {
        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "headline-xl": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "button": ["16px", { "lineHeight": "24px", "fontWeight": "600" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "label-bold": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }]
      }
    },
  },
  plugins: [],
}
