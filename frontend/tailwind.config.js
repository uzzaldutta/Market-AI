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
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        border: 'var(--border)',
        terminal: {
          dark: '#0b0f17',
          surface: '#111827',
          border: '#1f2937',
          hover: '#1e293b',
          text: '#f3f4f6',
          muted: '#9ca3af',
          green: '#10b981',
          red: '#ef4444',
          accent: '#3b82f6',
          gold: '#f59e0b',
        }
      },
    },
  },
  plugins: [],
}
