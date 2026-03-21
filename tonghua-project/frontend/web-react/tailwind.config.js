/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'paper': '#F5F0E8',
        'aged-stock': '#EDE6D6',
        'warm-gray': '#D4CFC4',
        'ink': '#1A1A16',
        'ink-faded': '#4A4540',
        'sepia-mid': '#5C4D3D',
        'rust': '#8B3A2A',
        'archive-brown': '#5C4033',
        'pale-gold': '#C4A45A',
        'sepia-on-dark': '#B5A595',
      },
      fontFamily: {
        'display': ['"Playfair Display"', 'Georgia', 'serif'],
        'body': ['"IBM Plex Mono"', '"Courier New"', 'monospace'],
        'ui': ['Inter', '"Source Sans Pro"', 'sans-serif'],
      },
      fontSize: {
        'hero': 'clamp(64px, 10vw, 120px)',
        'h1': 'clamp(40px, 6vw, 72px)',
        'h2': 'clamp(28px, 4vw, 48px)',
        'h3': 'clamp(20px, 2.5vw, 32px)',
        'overline': '10px',
        'label': '11px',
        'caption': '12px',
        'body-sm': '14px',
        'body': '16px',
      },
    },
  },
  plugins: [],
};
