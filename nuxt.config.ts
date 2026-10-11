import Aura from '@primeuix/themes/aura'
import { definePreset, palette } from '@primeuix/themes'

// Soho is a showcase surface palette; it is not part of Aura's built-in tokens.
const soho = {
  0: '#ffffff',
  50: '#f4f4f4',
  100: '#e8e9e9',
  200: '#d2d2d4',
  300: '#bbbcbe',
  400: '#a5a5a9',
  500: '#8e8f93',
  600: '#77787d',
  700: '#616268',
  800: '#4a4b52',
  900: '#34343d',
  950: '#1d1e27'
}

const WarframePreset = definePreset(Aura, {
  semantic: {
    primary: palette('{emerald}'),
    colorScheme: {
      light: { surface: soho },
      dark: { surface: soho }
    }
  }
})

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@primevue/nuxt-module'],
  css: ['~/assets/css/main.css'],
  tailwindcss: { cssPath: false },
  primevue: {
    options: {
      theme: {
        preset: WarframePreset,
        options: {
          cssLayer: {
            name: 'primevue',
            order: 'tailwind-base, primevue, tailwind-utilities'
          }
        }
      }
    }
  }
})
