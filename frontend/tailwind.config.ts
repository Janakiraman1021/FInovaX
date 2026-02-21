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
        // Midnight Galaxy Core
        galaxy: {
          void:   "#050510",
          deep:   "#0a0820",
          nebula: "#0d0b2a",
          cosmic: "#130d35",
          purple: "#7c3aed",
          deep_purple: "#4c1d95",
          lavender: "#a78bfa",
          stardust: "#c4b5fd",
          pink:   "#ec4899",
          cyan:   "#06b6d4",
          star:   "#e2e8f0",
          gold:   "#f59e0b",
          emerald: "#10b981",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        // Status gradients — galaxy edition
        "pending-gradient":  "linear-gradient(90deg, #7c3aed, #ec4899)",
        "verified-gradient": "linear-gradient(90deg, #06b6d4, #6366f1)",
        "financed-gradient": "linear-gradient(90deg, #10b981, #06b6d4)",
        // Galaxy card bg
        "galaxy-card": "linear-gradient(135deg, rgba(20,10,55,0.80) 0%, rgba(8,5,22,0.90) 100%)",
        // Nebula gradient for buttons
        "nebula-btn":  "linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #06b6d4 100%)",
      },
      animation: {
        pulse:        "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer:      "shimmer 2.5s infinite linear",
        shake:        "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
        twinkle:      "starTwinkle 6s ease-in-out infinite alternate",
        float:        "galaxyFloat 6s ease-in-out infinite",
        "border-glow":"borderGlow 3s ease-in-out infinite",
        "cosmic-pulse":"cosmicPulse 3s ease-in-out infinite",
        orbit:        "orbitSpin 10s linear infinite",
        scan:         "scanLine 4s ease-in-out infinite",
        "nebula-shift":"nebulaShift 5s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200px 0" },
          "100%": { backgroundPosition:  "200px 0" },
        },
        shake: {
          "10%, 90%":       { transform: "translate3d(-1px, 0, 0)" },
          "20%, 80%":       { transform: "translate3d( 2px, 0, 0)" },
          "30%, 50%, 70%":  { transform: "translate3d(-4px, 0, 0)" },
          "40%, 60%":       { transform: "translate3d( 4px, 0, 0)" },
        },
        starTwinkle: {
          "0%":   { opacity: "0.55" },
          "50%":  { opacity: "1.00" },
          "100%": { opacity: "0.65" },
        },
        galaxyFloat: {
          "0%,100%": { transform: "translateY(0px) rotate(0deg)"   },
          "50%":     { transform: "translateY(-18px) rotate(4deg)" },
        },
        borderGlow: {
          "0%,100%": { borderColor: "rgba(167,139,250,0.25)" },
          "50%":     { borderColor: "rgba(167,139,250,0.65)" },
        },
        cosmicPulse: {
          "0%,100%": { boxShadow: "0 0 20px rgba(124,58,237,0.40), 0 0 40px rgba(124,58,237,0.20)" },
          "50%":     { boxShadow: "0 0 50px rgba(124,58,237,0.80), 0 0 90px rgba(124,58,237,0.40), 0 0 130px rgba(236,72,153,0.25)" },
        },
        orbitSpin: {
          from: { transform: "rotate(0deg)"   },
          to:   { transform: "rotate(360deg)" },
        },
        scanLine: {
          "0%":  { top: "-5%",  opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%":{ top: "105%", opacity: "0" },
        },
        nebulaShift: {
          "0%":   { backgroundPosition: "0% 50%"   },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%"   },
        },
      },
      boxShadow: {
        "galaxy-sm":  "0 0 15px rgba(124,58,237,0.30)",
        "galaxy-md":  "0 0 30px rgba(124,58,237,0.40), 0 0 60px rgba(124,58,237,0.15)",
        "galaxy-lg":  "0 0 50px rgba(124,58,237,0.55), 0 0 100px rgba(124,58,237,0.25)",
        "pink-glow":  "0 0 30px rgba(236,72,153,0.45)",
        "cyan-glow":  "0 0 30px rgba(6,182,212,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
