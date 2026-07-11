/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Signature violet
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Fuchsia accent (gradient partner + energy)
        accent: {
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
        },
        // Warm-neutral ink scale for text/surfaces.
        // Mid tones (400–600) are deliberately dark so body/muted text stays
        // high-contrast and readable on translucent glass surfaces.
        ink: {
          50: '#f7f7f9',
          100: '#eeeef2',
          200: '#dcdce4',
          300: '#b9bac8',
          400: '#7c7e92',
          500: '#565971',
          600: '#3e4052',
          700: '#33343f',
          800: '#26272f',
          900: '#181920',
          950: '#0b0b14',
        },
      },
      fontFamily: {
        sans: ['Satoshi', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Clash Display"', 'Satoshi', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,16,28,0.04), 0 4px 16px -8px rgba(16,16,28,0.10)',
        card: '0 1px 3px rgba(16,16,28,0.05), 0 12px 32px -16px rgba(16,16,28,0.18)',
        lift: '0 8px 40px -12px rgba(124,58,237,0.28)',
        glow: '0 0 0 1px rgba(124,58,237,0.10), 0 8px 30px -8px rgba(124,58,237,0.35)',
        glass: '0 4px 30px rgba(16,16,28,0.08), inset 0 1px 0 rgba(255,255,255,0.55)',
        'glass-lg': '0 20px 60px -20px rgba(76,29,149,0.30), inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
        mesh:
          'radial-gradient(60% 60% at 20% 20%, rgba(124,58,237,0.35) 0%, transparent 60%), radial-gradient(50% 50% at 80% 30%, rgba(217,70,239,0.30) 0%, transparent 55%), radial-gradient(60% 60% at 60% 90%, rgba(139,92,246,0.25) 0%, transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s ease-out infinite',
      },
    },
  },
  plugins: [],
};
