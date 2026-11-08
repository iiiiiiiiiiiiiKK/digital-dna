/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#04050a',
          900: '#070912',
          850: '#0a0d18',
          800: '#0e1220',
          700: '#161b2d',
          600: '#212840',
          500: '#2d3552',
        },
        neon: {
          cyan: '#22e6ff',
          blue: '#4c7dff',
          violet: '#b14bff',
          pink: '#ff4bb8',
          lime: '#9dff5c',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(34, 230, 255, 0.55)',
        violet: '0 0 50px -14px rgba(177, 75, 255, 0.6)',
        card: '0 24px 60px -32px rgba(0, 0, 0, 0.9)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(2%, -3%, 0) scale(1.04)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        drift: 'drift 18s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
        fadeUp: 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        spinSlow: 'spinSlow 26s linear infinite',
      },
    },
  },
  plugins: [],
};
