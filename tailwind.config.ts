import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef5ff',
          100: '#d9e9ff',
          200: '#b3d3ff',
          300: '#86b7ff',
          400: '#5696ff',
          500: '#2f79ff',
          600: '#1e5fe0',
          700: '#1a51bb',
          800: '#1a4698',
          900: '#183c7a',
        }
      }
    }
  },
  plugins: [],
}
export default config
