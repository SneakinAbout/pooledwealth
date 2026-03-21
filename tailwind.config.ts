import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark backgrounds — zinc/near-black scale.
        // Named "navy" for historical reasons; do not rename without a
        // global find-and-replace across all component files.
        navy: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Brand accent — purple/violet scale.
        // Named "gold" for historical reasons; do not rename without a
        // global find-and-replace across all component files.
        gold: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Price / financial accent (amber)
        amber: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // New design system tokens
        brand: {
          DEFAULT: '#1A2B1F',
          light:   '#2E4A35',
        },
        accent: {
          DEFAULT: '#C9A84C',
          light:   '#E8CFA0',
          muted:   '#E8CFA0',
        },
        ink: {
          DEFAULT: '#1A1207',
          muted:   '#6A5A40',
          faint:   '#8A7A60',
        },
        surface: {
          page:    '#F7F4EE',
          card:    '#FFFFFF',
          sand:    '#EDE6D6',
          wheat:   '#E8CFA0',
        },
        walnut: '#4A3520',
      },
    },
  },
  plugins: [],
};

export default config;
