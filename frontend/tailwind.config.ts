import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Midnight Galaxy Design System
        mg: {
          base:     "#f5f3ff",
          surface:  "#ede9fd",
          card:     "#ffffff",
          elevated: "#f0ecfc",
          cosmic:   "#4a4e8f",
          lavender: "#6b5ea0",
          silver:   "#1e1433",
          muted:    "#5e5278",
          dim:      "#9188a8",
        },
        // Legacy galaxy tokens kept for compatibility
        galaxy: {
          void:     "#f5f3ff",
          deep:     "#ede9fd",
          card:     "#ffffff",
          purple:   "#4a4e8f",
          lavender: "#6b5ea0",
          pink:     "#7c3aed",
          cyan:     "#4f46e5",
          star:     "#1e1433",
          gold:     "#d97706",
          emerald:  "#059669",
        },
        // Status palette
        status: {
          success: "#059669",
          warning: "#d97706",
          danger:  "#dc2626",
          info:    "#2563eb",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Menlo", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mg-card-gradient":  "linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(240,236,252,0.90) 100%)",
        "mg-btn-gradient":   "linear-gradient(135deg, #4a4e8f 0%, #5c5aa0 50%, #6b5ea0 100%)",
        "mg-accent-gradient":"linear-gradient(90deg, #4a4e8f 0%, #6b5ea0 100%)",
        // Legacy
        "galaxy-card":       "linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(240,236,252,0.90) 100%)",
        "nebula-btn":        "linear-gradient(135deg, #4a4e8f 0%, #6b5fa0 50%, #a490c2 100%)",
        "pending-gradient":  "linear-gradient(90deg, #4a4e8f, #a490c2)",
        "verified-gradient": "linear-gradient(90deg, #34d399, #4a4e8f)",
        "financed-gradient": "linear-gradient(90deg, #34d399, #60a5fa)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        "mg-sm":    "0 2px 8px rgba(74,78,143,0.10), 0 0 0 1px rgba(74,78,143,0.07)",
        "mg-md":    "0 4px 16px rgba(74,78,143,0.12), 0 0 0 1px rgba(74,78,143,0.09)",
        "mg-lg":    "0 8px 32px rgba(74,78,143,0.16), 0 0 0 1px rgba(74,78,143,0.10)",
        "mg-glow":  "0 0 24px rgba(107,94,160,0.20)",
        "galaxy-sm":"0 4px 16px rgba(74,78,143,0.22)",
        "galaxy-md":"0 8px 24px rgba(74,78,143,0.28)",
        "pink-glow": "0 0 20px rgba(192,132,252,0.25)",
        "cyan-glow": "0 0 20px rgba(129,140,248,0.25)",
      },
      animation: {
        "pulse":        "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin360":      "spin360 1.2s linear infinite",
        "shimmer":      "shimmer 2.5s infinite linear",
        "subtle-float": "subtleFloat 6s ease-in-out infinite",
        "cosmic-pulse": "cosmicPulse 3s ease-in-out infinite",
        "fade-up":      "fadeUp 0.6s ease forwards",
        "border-pulse": "borderPulse 3s ease-in-out infinite",
        "shake":        "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
        // Legacy
        "float":        "subtleFloat 6s ease-in-out infinite",
        "orbit":        "spin360 10s linear infinite",
        "twinkle":      "cosmicPulse 4s ease-in-out infinite",
        scan:           "scanLine 4s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        shake: {
          "10%, 90%":      { transform: "translate3d(-1px, 0, 0)" },
          "20%, 80%":      { transform: "translate3d(2px, 0, 0)" },
          "30%, 50%, 70%": { transform: "translate3d(-4px, 0, 0)" },
          "40%, 60%":      { transform: "translate3d(4px, 0, 0)" },
        },
        cosmicPulse: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%":      { opacity: "1",   transform: "scale(1.04)" },
        },
        subtleFloat: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        borderPulse: {
          "0%, 100%": { borderColor: "rgba(74,78,143,0.14)" },
          "50%":      { borderColor: "rgba(74,78,143,0.30)" },
        },
        scanLine: {
          "0%":   { top: "-2px", opacity: "0" },
          "10%":  { opacity: "0.8" },
          "90%":  { opacity: "0.6" },
          "100%": { top: "100%", opacity: "0" },
        },
        spin360: { to: { transform: "rotate(360deg)" } },
        galaxyFloat: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-8px)" },
        },
        borderGlow: {
          "0%,100%": { borderColor: "rgba(164,144,194,0.18)" },
          "50%":     { borderColor: "rgba(164,144,194,0.45)" },
        },
        nebulaShift: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%":     { backgroundPosition: "100% 50%" },
        },
        orbitSpin: { to: { transform: "rotate(360deg)" } },
        starTwinkle: {
          "0%,100%": { opacity: "0.5" },
          "50%":     { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
