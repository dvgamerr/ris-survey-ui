import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-19',
  devtools: { enabled: false },
  app: {
    head: {
      title: 'SURVEY-POS',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Survey checking list.' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  css: [
    'bootstrap/dist/css/bootstrap.css',
    'bootstrap-vue-next/dist/bootstrap-vue-next.css',
    '~/assets/scss/index.scss',
  ],
  plugins: [
    '~/plugins/app-services',
    '~/plugins/bootstrap-vue-next',
    '~/plugins/fontawesome',
    '~/plugins/vue-toast',
  ],
  runtimeConfig: {
    public: {
      apiBase: process.env.AXIOS_BASE_URL || 'http://10.0.80.52:3000/',
    },
  },
})
