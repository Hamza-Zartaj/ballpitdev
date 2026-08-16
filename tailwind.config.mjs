/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";

const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        Default: {
          Dark: "rgba(2, 2, 3, 1)",
          White: "rgba(255, 255, 255, 1)",
        },

        Primary: {
          200: "rgba(73, 58, 191, 0.6)",
          400: "rgba(73, 58, 191, 1)",
          500: "rgba(91, 73, 239, 1)",
          800: "rgba(239, 237, 253, 1)",
        },
        Secondary: {
          500: "rgba(255, 222, 190, 1)",
        },
        // New Landing Page Colors (Purple & Beige)
        purple: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },

        beige: {
          50: "#faf9f6",
          100: "#f5f5f0",
          200: "#e6e6e0",
          300: "#dcdcd6",
          400: "#d2d2cc",
          500: "#c8c8c2",
          600: "#bebeb8",
          700: "#b4b4ae",
          800: "#aaaaa4",
          900: "#a0a09a",
        },

        Grey: {
          500: "rgba(96, 96, 108, 1)",
          600: "rgba(169, 169, 178, 1)",
          700: "rgba(223, 223, 226, 1)",
          800: "rgba(244, 244, 245, 1)",
        },
        Warning: {
          400: "rgba(191, 120, 58, 1)",
          500: "rgba(239, 150, 73, 1)",
          800: "rgba(253, 245, 237, 1)",
        },
        Error: {
          400: "rgba(191, 58, 58, 1)",
          500: "rgba(239, 73, 73, 1)",
          800: "rgba(253, 237, 237, 1)",
        },
        Success: {
          400: "rgba(13, 150, 104, 1)",
          500: "rgba(16, 188, 131, 1)",
          800: "rgba(231, 248, 243, 1)",
        },
        Others: {
          Pink: "rgba(239, 73, 148, 1)",
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      screens: {
        xs: "320px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
        "3xl": "1700px",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
      },
      boxShadow: {
        custom:
          "0px 0px 10px 8px rgba(0, 0, 0, 0.2), 1px 0px 1px 0 rgba(0, 0, 0, 0.19)", // Custom box-shadow
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        "glass-sm": "0 4px 16px 0 rgba(31, 38, 135, 0.07)",
        neon: "0 0 5px theme('colors.purple.400'), 0 0 20px theme('colors.purple.600')",
      },
      backdropBlur: {
        xs: '2px',
      },
    },
    fontFamily: {
      cabinet: ["CabinetGrotesk", "Arial", "Helvetica", "sans-serif"],
      satoshi: ["Satoshi", "Arial", "Helvetica", "sans-serif"],
    },
    letterSpacing: {
      narrower: "-0.04em",
      narrow: "-0.02em",
      narrow: "-0.015em",
      narrow: "-0.01em",
      narrow: "-0.005em",
    },
    // Merged and extended Keyframes
    keyframes: {
      flow: {
        "0%": { transform: "translateX(100%)" },
        "30%": { transform: "translateX(0)" },
        "70%": { transform: "translateX(0)" },
        "100%": { transform: "translateX(-100%)" },
      },
      fadeInRight: {
        "0%": { opacity: 0, transform: "translateX(50%)" },
        "100%": { opacity: 1, transform: "translateX(0)" },
      },
      fadeIn: {
        "0%": { opacity: "0" },
        "100%": { opacity: "1" },
      },
      fadeOut: {
        "0%": { opacity: "1" },
        "100%": { opacity: "0" },
      },
      slideRight: {
        "0%": { transform: "translateX(-100%)" },
        "100%": { transform: "translateX(0)" },
      },
      slideInRight: {
        "0%": { transform: "translateX(100%)", opacity: "0" },
        "100%": { transform: "translateX(0)", opacity: "1" },
      },
      slideUp: {
        from: { opacity: 0, transform: "translateY(20px)" }, // Adjusted for subtle effect
        to: { opacity: 1, transform: "translateY(0)" },
      },
      zoomOut: {
        "0%": { transform: "scale(1)", opacity: "1" },
        "100%": { transform: "scale(0.5)", opacity: "0" },
      },
      spin: {
        "0%": { rotate: "1deg" },
        "100%": { rotate: "360deg" },
      },
      // New Animations
      float: {
        "0%, 100%": { transform: "translateY(0)" },
        "50%": { transform: "translateY(-20px)" },
      },
      "pulse-glow": {
        "0%, 100%": { opacity: 0.6, transform: "scale(1)" },
        "50%": { opacity: 1, transform: "scale(1.05)" },
      },
      "data-stream": {
        "0%": { backgroundPosition: "0% 50%" },
        "100%": { backgroundPosition: "100% 50%" },
      },
    },
    animation: {
      "flow-1": "flow 5s ease-in-out 2.5s infinite",
      "flow-2": "flow 5s ease-in-out 5s infinite",
      "fade-in-right": "fadeInRight 1s ease-in-out",
      slideUp: "slideUp 0.5s ease-out",
      zoomOut: "zoomOut 1.3s ease-in-out forwards",
      spin: "spin 0.5s linear infinite",
      "fade-in": "fadeIn 0.3s ease-out",
      "slide-right": "slideRight 0.7s ease-out",
      "slide-up": "slideUp 0.5s ease-out",
      slideInRight: "slideInRight 0.5s ease-out",
      "fade-out": "fadeOut 0.3s ease-out",
      // New
      float: "float 6s ease-in-out infinite",
      "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      "data-stream": "data-stream 3s linear infinite",
    },
  },
};

export default config;
