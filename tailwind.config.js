/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        /* Brand */
        primary:          '#0052ff',
        'primary-active': '#003ecc',
        'primary-disabled':'#a8b8cc',

        /* Text */
        ink:         '#0a0b0d',
        body:        '#5b616e',
        muted:       '#7c828a',
        'muted-soft':'#a8acb3',

        /* Surfaces — keep old names, updated hex */
        canvas:          '#ffffff',
        'canvas-soft':   '#f7f7f7',   /* was #efefef */
        'canvas-softer': '#eef0f3',   /* was #f3f3f3 */

        /* Hairlines */
        hairline:      '#dee1e6',
        'hairline-soft':'#eef0f3',

        /* Dark surfaces */
        'surface-dark':          '#0a0b0d',
        'surface-dark-elevated': '#16181c',

        /* Semantic */
        'semantic-up':   '#05b169',
        'semantic-down': '#cf202f',
      },
      borderRadius: {
        card: '24px',    /* updated from 16px → xl per DESIGNCOIN */
        pill: '100px',
        xl:   '24px',
        lg:   '16px',
        md:   '12px',
        sm:   '8px',
        xs:   '4px',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
