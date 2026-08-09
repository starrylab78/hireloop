/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F6F3', // warm-gray base, not the cliché cream
        ink: {
          DEFAULT: '#14171A',
          soft: '#3A403C',
          muted: '#5B6560',
        },
        border: '#DEDDD4',
        loop: {
          DEFAULT: '#1F5F4F', // deep teal-green — primary accent ("the loop")
          light: '#2E8A73',
          dark: '#123C31',
          tint: '#E4EEEA',
        },
        gold: {
          DEFAULT: '#E8B14D', // premium / Scale tier accent, used sparingly
          dark: '#C8912E',
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 23, 26, 0.04), 0 8px 24px -8px rgba(20, 23, 26, 0.08)',
      },
    },
  },
  plugins: [],
};
