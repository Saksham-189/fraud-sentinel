/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* ── New Design System (CSS-var-based → auto dark/light) ── */
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        accent: {
          violet: "var(--accent-violet)",
          pink: "var(--accent-pink)",
          cyan: "var(--accent-cyan)",
          lime: "var(--accent-lime)",
          amber: "var(--accent-amber)",
        },

        /* ── Backward-Compatible Tokens ── */
        "primary": "#7c3aed",
        "primary-container": "#a78bfa",
        "on-primary": "#ffffff",
        "secondary": "#ec4899",
        "secondary-container": "#f472b6",
        "on-secondary": "#ffffff",
        "error": "#ef4444",

        /* Surface tokens (now driven by CSS vars) */
        "surface-variant": "var(--surface-3)",
        "surface-container-lowest": "var(--surface-1)",
        "surface-container-low": "var(--surface-0)",
        "surface-container": "var(--surface-0)",
        "surface-container-high": "var(--surface-2)",
        "surface-container-highest": "var(--surface-3)",
        "on-surface": "var(--text-primary)",
        "on-surface-variant": "var(--text-secondary)",
        "outline": "var(--border-default)",
        "outline-variant": "var(--border-default)",
        "background": "var(--surface-0)",
        "on-background": "var(--text-primary)",
      },

      fontFamily: {
        headline: ["Space Grotesk", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        /* Legacy aliases */
        "headline-xl": ["Space Grotesk"],
        "headline-md": ["Space Grotesk"],
        "headline-lg": ["Space Grotesk"],
        "body-sm": ["Inter"],
        "body-md": ["Inter"],
        "label-caps": ["Inter"],
        "body-lg": ["Inter"],
      },

      fontSize: {
        "headline-xl": ["40px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["30px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
      },

      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },

      boxShadow: {
        "glow-violet": "0 0 20px rgba(124, 58, 237, 0.25)",
        "glow-violet-lg": "0 0 40px rgba(124, 58, 237, 0.3), 0 0 80px rgba(124, 58, 237, 0.1)",
        "glow-pink": "0 0 20px rgba(236, 72, 153, 0.25)",
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.25)",
        "glow-lime": "0 0 20px rgba(132, 204, 22, 0.25)",
        "glass": "0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        "glass-strong": "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      },

      animation: {
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 3s ease infinite",
        "border-rotate": "border-rotate 4s linear infinite",
        "wave": "wave 1.5s ease-in-out",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
        "aurora-drift": "aurora-drift 20s ease-in-out infinite alternate",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "border-rotate": {
          to: { "--angle": "360deg" },
        },
        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(20deg)" },
          "75%": { transform: "rotate(-10deg)" },
        },
        "neon-pulse": {
          "0%, 100%": { boxShadow: "0 0 4px currentColor, 0 0 8px currentColor" },
          "50%": { boxShadow: "0 0 8px currentColor, 0 0 16px currentColor, 0 0 24px currentColor" },
        },
        "aurora-drift": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(-3%, 2%) scale(1.02)" },
          "66%": { transform: "translate(3%, -2%) scale(0.98)" },
          "100%": { transform: "translate(0, 0) scale(1)" },
        },
      },

      spacing: {
        gutter: "24px",
        "container-max": "1440px",
      },
    },
  },
  plugins: [],
};
