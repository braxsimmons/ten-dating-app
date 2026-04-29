import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0A0A",
          50: "#FAFAFA",
          100: "#F4F4F4",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#3F3F3F",
          800: "#262626",
          900: "#171717",
        },
        ember: {
          DEFAULT: "#F26B3A",
          50:  "#FFF1EB",
          100: "#FFE0D1",
          200: "#FFC1A4",
          300: "#FFA177",
          400: "#FF8550",
          500: "#F26B3A",
          600: "#D45525",
          700: "#A8421C",
          800: "#7C3015",
          900: "#511E0E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        card: "0 8px 30px -12px rgba(0,0,0,0.18)",
        glow: "0 0 0 4px rgba(242, 107, 58, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 240ms ease-out",
        "slide-up": "slideUp 320ms cubic-bezier(0.16,1,0.3,1)",
        "match-pop": "matchPop 480ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        matchPop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
