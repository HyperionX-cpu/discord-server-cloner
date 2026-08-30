/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple: '#5865F2',
          green: '#57F287',
          yellow: '#FEE75C',
          fuchsia: '#EB459E',
          red: '#ED4245',
          darkBg: '#1e1f22',
          cardBg: '#2b2d31',
          panelBg: '#313338',
          hoverBg: '#35373c',
          textMuted: '#949ba4',
          textNormal: '#dbdee1',
          textHeader: '#f2f3f5'
        }
      }
    },
  },
  plugins: [],
}
