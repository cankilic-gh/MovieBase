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
          dark: '#0A0E27',
          panel: '#1a0b0b',
          cyan: '#00F3FF', // Neon Cyan (primary accent)
          purple: '#FF00FF', // Neon Magenta
          red: '#DC143C', // Crimson Red (replaces gold/yellow)
          orange: '#FF4D00', // Neon Orange-Red
          blue: '#0066FF', // Neon Blue
          green: '#00FF88', // Neon Green
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Orbitron', 'monospace'],
        retro: ['Bungee', 'Bebas Neue', 'sans-serif'],
        display: ['Bungee', 'Bebas Neue', 'Orbitron', 'sans-serif'],
      },
      backgroundImage: {
        'cyber-grid': "linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px)",
        'holographic': "linear-gradient(135deg, rgba(0, 243, 255, 0.1) 0%, rgba(255, 0, 255, 0.05) 50%, rgba(220, 20, 60, 0.1) 100%)",
        'neon-gradient': "linear-gradient(135deg, rgba(0, 243, 255, 0.2) 0%, rgba(255, 0, 255, 0.1) 100%)",
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 243, 255, 0.5), 0 0 20px rgba(0, 243, 255, 0.3), 0 0 30px rgba(0, 243, 255, 0.1)',
        'neon-red': '0 0 10px rgba(220, 20, 60, 0.5), 0 0 20px rgba(220, 20, 60, 0.3), 0 0 30px rgba(220, 20, 60, 0.1)',
        'neon-orange': '0 0 10px rgba(255, 77, 0, 0.5), 0 0 20px rgba(255, 77, 0, 0.3), 0 0 30px rgba(255, 77, 0, 0.1)',
        'neon-purple': '0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3), 0 0 30px rgba(255, 0, 255, 0.1)',
        'neon-blue': '0 0 10px rgba(0, 102, 255, 0.5), 0 0 20px rgba(0, 102, 255, 0.3), 0 0 30px rgba(0, 102, 255, 0.1)',
      },
      animation: {
        'glitch': 'glitch 1s linear infinite',
        'glitch-1': 'glitch-1 2.5s infinite linear alternate-reverse',
        'glitch-2': 'glitch-2 3s infinite linear alternate-reverse',
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
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
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 10px rgba(0, 243, 255, 0.5), 0 0 20px rgba(0, 243, 255, 0.3)',
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(0, 243, 255, 0.8), 0 0 40px rgba(0, 243, 255, 0.5), 0 0 60px rgba(0, 243, 255, 0.2)',
          },
        }
      }
    }
  },
  plugins: [],
}