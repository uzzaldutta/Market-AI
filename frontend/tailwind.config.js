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
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        border: 'var(--border)',
        terminal: {
          dark: '#080d16',
          surface: '#0f172a',
          surfaceLight: '#17223b',
          border: '#1e293b',
          hover: '#1e293b',
          text: '#f1f5f9',
          muted: '#94a3b8',
          green: '#10b981',
          greenGlow: 'rgba(16, 185, 129, 0.15)',
          red: '#ef4444',
          redGlow: 'rgba(239, 68, 68, 0.15)',
          accent: '#3b82f6',
          gold: '#f59e0b',
        }
      },
    },
  },
  plugins: [],
}
