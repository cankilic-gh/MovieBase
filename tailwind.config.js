/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#030005',
          dark: '#0f0505',
          panel: '#1a0b0b',
          cyan: '#FFD700', // Cyberpunk Yellow (main accent)
          purple: '#00F3FF', // Cyberpunk Cyan Glow
          green: '#6B8E6B', // Muted Green
          red: '#ff4d00',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Orbitron', 'monospace'],
      },
      backgroundImage: {
        'cyber-grid': "linear-gradient(rgba(255, 215, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 215, 0, 0.03) 1px, transparent 1px)",
        'holographic': "linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0,243,255,0.01) 100%)",
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3)',
        'neon-purple': '0 0 10px rgba(0, 243, 255, 0.5), 0 0 20px rgba(0, 243, 255, 0.3)',
      },
      animation: {
        'glitch': 'glitch 1s linear infinite',
        'glitch-1': 'glitch-1 2.5s infinite linear alternate-reverse',
        'glitch-2': 'glitch-2 3s infinite linear alternate-reverse',
      },
      keyframes: {
        glitch: {
          '2%, 64%': { transform: 'translate(2px,0) skew(0deg)' },
          '4%, 60%': { transform: 'translate(-2px,0) skew(0deg)' },
          '62%': { transform: 'translate(0,0) skew(5deg)' },
        },
        'glitch-1': {
          '0%': { clipPath: 'inset(20% 0 80% 0)', transform: 'translate(-2px, 1px)' },
          '20%': { clipPath: 'inset(60% 0 10% 0)', transform: 'translate(2px, -1px)' },
          '40%': { clipPath: 'inset(40% 0 50% 0)', transform: 'translate(-2px, 2px)' },
          '60%': { clipPath: 'inset(80% 0 5% 0)', transform: 'translate(2px, -2px)' },
          '80%': { clipPath: 'inset(10% 0 70% 0)', transform: 'translate(-1px, 1px)' },
          '100%': { clipPath: 'inset(30% 0 50% 0)', transform: 'translate(1px, -1px)' },
        },
        'glitch-2': {
          '0%': { clipPath: 'inset(10% 0 60% 0)', transform: 'translate(2px, -1px)' },
          '20%': { clipPath: 'inset(80% 0 5% 0)', transform: 'translate(-2px, 1px)' },
          '40%': { clipPath: 'inset(30% 0 20% 0)', transform: 'translate(2px, 2px)' },
          '60%': { clipPath: 'inset(10% 0 80% 0)', transform: 'translate(-2px, -2px)' },
          '80%': { clipPath: 'inset(50% 0 30% 0)', transform: 'translate(1px, 1px)' },
          '100%': { clipPath: 'inset(70% 0 10% 0)', transform: 'translate(-1px, -1px)' },
        }
      }
    }
  },
  plugins: [],
}