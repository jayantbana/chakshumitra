import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body:    ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        // Surfaces
        bg:               "var(--color-bg)",
        surface:          "var(--color-surface)",
        "surface-2":      "var(--color-surface-2)",
        "surface-offset": "var(--color-surface-offset)",
        "surface-dynamic":"var(--color-surface-dynamic)",
        border:           "var(--color-border)",
        divider:          "var(--color-divider)",

        // Text
        text:         "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        "text-faint": "var(--color-text-faint)",
        "text-inverse":"var(--color-text-inverse)",

        // Accents
        primary:   "var(--color-primary)",
        secondary: "var(--color-secondary)",
        success:   "var(--color-success)",
        warning:   "var(--color-warning)",
        error:     "var(--color-error)",
        emergency: "var(--color-emergency)",
      },
      borderRadius: {
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        "2xl":"var(--radius-2xl)",
        "3xl":"var(--radius-3xl)",
      },
      boxShadow: {
        sm:          "var(--shadow-sm)",
        md:          "var(--shadow-md)",
        lg:          "var(--shadow-lg)",
        card:        "var(--shadow-card)",
        "card-hover":"var(--shadow-card-hover)",
        "teal-glow": "var(--shadow-teal-glow)",
        "teal-glow-lg":"var(--shadow-teal-glow-lg)",
      },
      spacing: {
        1:  "var(--space-1)",
        2:  "var(--space-2)",
        3:  "var(--space-3)",
        4:  "var(--space-4)",
        5:  "var(--space-5)",
        6:  "var(--space-6)",
        8:  "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        20: "var(--space-20)",
        24: "var(--space-24)",
        32: "var(--space-32)",
      },
      maxWidth: {
        narrow:  "var(--content-narrow)",
        default: "var(--content-default)",
        wide:    "var(--content-wide)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;