/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        shed: {
          bg: '#0a0a0f',
          card: '#12121f',
          border: '#2a2a3e',
          input: '#1a1a2e',
          accent: '#d97706',
          success: '#22c55e',
          danger: '#8b0000',
        },
      },
      fontFamily: {
        heading: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
