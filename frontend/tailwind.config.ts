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
          base:     "#1a1128",
          surface:  "#231739",
          card:     "#2b1e3e",
          elevated: "#342447",
          cosmic:   "#4a4e8f",
          lavender: "#a490c2",
          silver:   "#e6e6fa",
          muted:    "#8b7da0",
          dim:      "#5c4f6e",
        },
        // Legacy galaxy tokens kept for compatibility
        galaxy: {
          void:     "#1a1128",
          deep:     "#231739",
          card:     "#2b1e3e",
          purple:   "#4a4e8f",
          lavender: "#a490c2",
          pink:     "#c084fc",
          cyan:     "#818cf8",
          star:     "#e6e6fa",
          gold:     "#fbbf24",
          emerald:  "#34d399",
        },
        // Status palette
        status: {
          success: "#34d399",
          warning: "#fbbf24",
          danger:  "#f87171",
          info:    "#60a5fa",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Menlo", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mg-card-gradient":  "linear-gradient(145deg, rgba(43,30,62,0.65) 0%, rgba(26,17,40,0.80) 100%)",
        "mg-btn-gradient":   "linear-gradient(135deg, #4a4e8f 0%, #6b5fa0 50%, #a490c2 100%)",
        "mg-accent-gradient":"linear-gradient(90deg, #a490c2 0%, #e6e6fa 100%)",
        // Legacy
        "galaxy-card":       "linear-gradient(135deg, rgba(43,30,62,0.65) 0%, rgba(26,17,40,0.80) 100%)",
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
        "mg-sm":    "0 2px 8px rgba(74,78,143,0.15), 0 0 0 1px rgba(164,144,194,0.08)",
        "mg-md":    "0 4px 16px rgba(74,78,143,0.22), 0 0 0 1px rgba(164,144,194,0.10)",
        "mg-lg":    "0 8px 32px rgba(74,78,143,0.30), 0 0 0 1px rgba(164,144,194,0.12)",
        "mg-glow":  "0 0 24px rgba(164,144,194,0.25)",
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
          "0%, 100%": { borderColor: "rgba(164,144,194,0.18)" },
          "50%":      { borderColor: "rgba(164,144,194,0.38)" },
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
