import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Design tokens from Stitch FlowSync design system ──────────────────
      colors: {
        // Surfaces (tonal layering — no heavy shadows)
        surface: {
          DEFAULT: "#111319",   // Level 0 — App canvas
          dim:     "#111319",
          bright:  "#373940",
          low:     "#191b22",   // Level 1 — Sidebar/nav
          base:    "#1e1f26",   // Level 2 — Cards
          high:    "#282a30",
          highest: "#33343b",
        },
        // Primary — Indigo for actions and active states
        primary: {
          DEFAULT: "#6366f1",
          dim:     "#c0c1ff",
          container: "#8083ff",
        },
        // On-colors (text on colored backgrounds)
        on: {
          surface:  "#e2e2eb",
          muted:    "#c7c4d7",
          primary:  "#ffffff",
        },
        // Structural borders
        border: {
          DEFAULT: "#2a2d3e",
          subtle:  "#464554",
        },
        // Semantic status colors
        status: {
          healthy:  "#10b981",  // Emerald
          degraded: "#f59e0b",  // Amber
          failed:   "#f43f5e",  // Rose
          syncing:  "#3b82f6",  // Blue
          pending:  "#6b7280",  // Gray
        },
        // Aliases for semantic color bg tints (10% opacity)
        "status-bg": {
          healthy:  "rgba(16, 185, 129, 0.10)",
          degraded: "rgba(245, 158, 11, 0.10)",
          failed:   "rgba(244, 63, 94, 0.10)",
          syncing:  "rgba(59, 130, 246, 0.10)",
          pending:  "rgba(107, 114, 128, 0.10)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "Consolas", "monospace"],
      },
      fontSize: {
        // Stitch type scale
        "headline-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-md": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "body-md":     ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm":     ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "label-md":    ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" }],
        "mono-md":     ["13px", { lineHeight: "20px", fontWeight: "400" }],
        "mono-sm":     ["11px", { lineHeight: "16px", fontWeight: "400" }],
      },
      borderRadius: {
        sm:  "0.125rem", // 2px
        DEFAULT: "0.25rem", // 4px
        md:  "0.375rem", // 6px — max for cards/buttons per Stitch
        lg:  "0.5rem",
        xl:  "0.75rem",
        full: "9999px",
      },
      spacing: {
        // 4px base unit scale
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        sidebar: "240px",
        topnav:  "56px",
      },
      boxShadow: {
        // Floating elements only (modals, dropdowns) — sharp 4px offset, 0 blur
        float: "4px 4px 0px rgba(0, 0, 0, 0.4)",
        none: "none",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.15s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
