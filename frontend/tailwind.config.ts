
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}",
    "./src/contexts/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/utils/**/*.{ts,tsx}",
    "./src/types/**/*.{ts,tsx}",
    "./src/integrations/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'sans': ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        'helvetica': ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "vb-primary": "#3B82F6",
        "vb-secondary": "#64748B",
        "vb-accent": "#8B5CF6",
        "vb-muted": "#F1F5F9",
        "blue-25": "#F8FAFF",
        // Cores específicas das atividades - idênticas à referência
        "activities": {
          "bg": "#F8FAFC",
          "header": "#FFFFFF",
          "border": "#E5E7EB",
          "text": {
            "primary": "#111827",
            "secondary": "#6B7280",
            "muted": "#9CA3AF"
          },
          "priority": {
            "urgent": {
              "bg": "#FEE2E2",
              "text": "#DC2626",
              "border": "#FECACA"
            },
            "high": {
              "bg": "#FEF3C7",
              "text": "#D97706",
              "border": "#FDE68A"
            },
            "medium": {
              "bg": "#DBEAFE",
              "text": "#2563EB",
              "border": "#BFDBFE"
            },
            "low": {
              "bg": "#D1FAE5",
              "text": "#059669",
              "border": "#A7F3D0"
            }
          },
          "tab": {
            "active": "#2B6CB0",
            "inactive": "#6B7280",
            "hover": "#F3F4F6"
          },
          "button": {
            "primary": "#0C1A3B",
            "hover": "#0F2A5C"
          }
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
