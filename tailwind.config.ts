import type { Config } from 'tailwindcss';

// ============================================================
// DESIGN TOKENS — "Carnețel de puzzle-uri"
// Fundal cerneală-navy, tile-uri tip fișă de hârtie,
// culori de tier muted/editoriale (nu neon).
// ============================================================
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1B2130', // fundal principal
          light: '#252C3E',   // suprafețe ridicate pe fundal
          border: '#333B52',
        },
        paper: {
          DEFAULT: '#F6F1E4', // tile-uri nerezolvate
          dim: '#E4DDC8',
        },
        accent: {
          DEFAULT: '#3FB8AF', // teal — acțiuni primare, focus
          dim: '#2E8880',
        },
        tier: {
          yellow: { DEFAULT: '#D9A441', text: '#332405' },
          green: { DEFAULT: '#5C8A5A', text: '#0E1A0D' },
          blue: { DEFAULT: '#4C7EA8', text: '#0A1520' },
          purple: { DEFAULT: '#8B5FA3', text: '#1C0F22' },
        },
      },
      fontFamily: {
        headline: ['var(--font-fraunces)', 'ui-serif', 'serif'],
        body: ['var(--font-sora)', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        settle: {
          '0%': { transform: 'scale(0.94)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        settle: 'settle 0.35s ease-out',
        popIn: 'popIn 0.25s ease-out',
      },
      backgroundImage: {
        'dot-grid':
          'radial-gradient(circle, rgba(246,241,228,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '22px 22px',
      },
    },
  },
  plugins: [],
};

export default config;
