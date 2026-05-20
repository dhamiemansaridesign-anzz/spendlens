/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // These don't change between themes — keep as hex so opacity modifiers work
        primary:           '#0052ff',
        'primary-active':  '#003ecc',
        'primary-disabled':'#a8b8cc',
        'semantic-up':     '#05b169',
        'semantic-down':   '#cf202f',

        // These change with theme — use CSS variables
        ink:           'var(--color-ink)',
        body:          'var(--color-body)',
        muted:         'var(--color-muted)',
        'muted-soft':  'var(--color-muted-soft)',
        canvas:        'var(--color-canvas)',
        'canvas-soft': 'var(--color-canvas-soft)',
        'canvas-softer':'var(--color-canvas-softer)',
        hairline:      'var(--color-hairline)',
        'hairline-soft':'var(--color-hairline-soft)',
        'surface-dark': 'var(--color-surface-dark)',
        'surface-dark-elevated': 'var(--color-surface-dark-elevated)',
      },
      borderRadius: {
        card: '24px',
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
