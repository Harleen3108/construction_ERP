/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Government India palette
        govt: {
          saffron: '#FF9933',
          white: '#FFFFFF',
          green: '#138808',
          navy: '#0B3D91',
          'navy-dark': '#072452',
          'navy-light': '#1E5BC7',
          gold: '#D4A017',
        },
        // ERP semantic
        erp: {
          primary: '#0B3D91',
          secondary: '#D4A017',
          success: '#138808',
          warning: '#FF9933',
          danger: '#C8102E',
          info: '#1E5BC7',
        },
      },
      fontFamily: {
        // Single family across the app — keeps every page identical to the dashboard
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        gov:  ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        gov: '0 1px 3px rgba(11, 61, 145, 0.12), 0 1px 2px rgba(11, 61, 145, 0.08)',
        'gov-lg': '0 4px 12px rgba(11, 61, 145, 0.15)',
      },
    },
  },
  plugins: [],
};
