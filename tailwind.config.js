/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // The deep background shades
        brand: {
          darkest: '#070a13',
          darker: '#0f172a',
          card: '#1e293b',
          border: '#334155',
        },
        // Action colors (Apex-style Purple)
        accent: {
          light: '#c084fc',
          DEFAULT: '#a855f7',
          dark: '#7e22ce',
          glow: 'rgba(168, 85, 247, 0.4)',
        },
        // Status colors
        status: {
          online: '#10b981',
          offline: '#ef4444',
          starting: '#f59e0b',
        }
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(168, 85, 247, 0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
