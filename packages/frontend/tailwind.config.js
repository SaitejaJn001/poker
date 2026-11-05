/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          bg: '#0a0c10',
          panel: '#12151c',
          card: '#181c26',
          border: '#262d3d',
          gold: '#e6c875',
          goldLight: '#fae69e',
          goldDark: '#b89230',
          felt: '#0f4228',
          feltDark: '#082617',
          feltLight: '#195c3a',
          rail: '#2b1b17',
          railDark: '#180e0c',
        },
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(230, 200, 117, 0.4)',
        'felt-inset': 'inset 0 0 60px rgba(0, 0, 0, 0.7)',
        'table-outer': '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(15, 66, 40, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-up': 'floatUp 1.8s ease-out forwards',
        'deal-card': 'dealCard 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.8)' },
          '20%': { opacity: '1', transform: 'translateY(-10px) scale(1.1)' },
          '80%': { opacity: '1', transform: 'translateY(-40px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-60px) scale(0.9)' },
        },
        dealCard: {
          '0%': { opacity: '0', transform: 'scale(0.5) translateY(-50px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

