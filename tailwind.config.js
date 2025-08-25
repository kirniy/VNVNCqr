/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'vnvnc-red': '#DC2626',
        'vnvnc-darkred': '#991B1B', 
        'vnvnc-lightred': '#EF4444',
        'vnvnc-black': '#000000',
        'vnvnc-gray': '#1F2937',
        'vnvnc-darkgray': '#111111',
      },
      fontFamily: {
        'display': ['Arial Black', 'Helvetica', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.5s ease-in-out',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': {
            opacity: '1',
            filter: 'drop-shadow(0 0 10px #DC2626)',
          },
          '50%': {
            opacity: '.8', 
            filter: 'drop-shadow(0 0 20px #DC2626)',
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}