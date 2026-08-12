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
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#FFF2DB',  // warm cream — secondary surfaces, card highlights
          100: '#FFE5BF',  // warm peach — borders, badges, selected states
          200: '#F5C8A0',  // muted warm — stronger borders when needed
          300: '#E89070',  // warm rose — muted accent
          400: '#D86050',  // deep warm rose — icon accent
          500: '#F62440',  // PRIMARY — CTAs, active states, important links
          600: '#D91C36',  // hover state for primary
          700: '#B5162C',  // active/pressed state
          800: '#8A1022',  // deep accent
          900: '#5C0A16',  // very dark
          950: '#3A0510',  // near-black
        },
        // Warm neutral palette for text hierarchy and surfaces
        warm: {
          50:  '#FFFAF3',  // page background
          100: '#FFF2DB',  // secondary surface
          200: '#FFE5BF',  // highlight / selected
          300: '#F0D9B5',  // warm border
          400: '#C8A87A',  // muted border / divider
          500: '#8C6D3F',  // muted text on warm surfaces
          600: '#5E4A2A',  // body text (warm charcoal)
          700: '#3D2E16',  // heading text
          800: '#2A1F0E',  // deep warm text
          900: '#1A1208',  // near-black warm
        },
      },
      animation: {
        'fade-in':     'fadeIn 0.5s ease-out',
        'slide-up':    'slideUp 0.5s ease-out',
        'slide-right': 'slideRight 0.4s ease-out',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        // Warm-tinted subtle grid
        'grid-pattern':      "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(200 168 122 / 0.10)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")",
        'grid-pattern-dark': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(200 168 122 / 0.06)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")",
      },
      boxShadow: {
        'card':     '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md':  '0 4px 12px 0 rgb(0 0 0 / 0.07)',
        'card-lg':  '0 10px 30px -5px rgb(0 0 0 / 0.10)',
        'brand':    '0 4px 14px 0 rgb(246 36 64 / 0.25)',
        'brand-lg': '0 8px 24px 0 rgb(246 36 64 / 0.30)',
        'warm':     '0 1px 3px 0 rgb(140 109 63 / 0.08), 0 1px 2px -1px rgb(140 109 63 / 0.08)',
      },
    },
  },
  plugins: [],
};
