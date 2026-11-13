/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        border: 'var(--border)',
        terminal: {
          dark: '#050811',
          darker: '#03050a',
          surface: '#090e1a',
          surfaceLight: '#0f172a',
          border: '#131c31',
          hover: '#17223b',
          text: '#f8fafc',
          muted: '#94a3b8',
          green: '#10b981',
          greenGlow: 'rgba(16, 185, 129, 0.2)',
          red: '#f43f5e',
          redGlow: 'rgba(244, 63, 94, 0.2)',
          accent: '#06b6d4',
          gold: '#f59e0b',
        }
      },
      animation: {
        'marquee': 'marquee-scroll 38s linear infinite',
      },
      keyframes: {
        'marquee-scroll': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
