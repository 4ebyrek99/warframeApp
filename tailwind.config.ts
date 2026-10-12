import type { Config } from 'tailwindcss'
import primeui from 'tailwindcss-primeui'

export default {
    content: ['./app/**/*.{vue,js,ts}', './components/**/*.{vue,js,ts}'],
    theme: { extend: {} },
    plugins: [primeui]
} satisfies Config
