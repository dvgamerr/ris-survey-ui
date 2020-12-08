const pkg = require('./package')

module.exports = {
  telemetry: false,
  head: {
    title: 'SURVEY-POS',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: pkg.description },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },
  loading: { color: '#4caf50' },
  css: [],
  plugins: [],
  components: true,
  buildModules: ['@nuxtjs/eslint-module'],
  router: {
    middleware: ['auth'],
    linkActiveClass: 'active',
    linkExactActiveClass: 'active',
  },
  modules: [
    // https://go.nuxtjs.dev/chakra
    '@chakra-ui/nuxt',
    // https://go.nuxtjs.dev/emotion
    '@nuxtjs/emotion',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
  ],
  serverMiddleware: [{ path: '/api', handler: '~/api/index.js' }],
  auth: {
    strategies: {
      local: {
        endpoints: {
          login: { url: '/auth/login', method: 'post', propertyName: 'token' },
          logout: { url: '/auth/logout', method: 'post' },
          user: { url: '/auth/user', method: 'get', propertyName: 'user' },
        },
      },
    },
    redirect: { login: '/sign-in', logout: '/sign-in', home: '/' },
  },
  privateRuntimeConfig: {
    axios: { baseURL: process.env.BASE_URL },
  },
  publicRuntimeConfig: {
    axios: { browserBaseURL: process.env.BROWSER_BASE_URL },
  },
  axios: {
    https: false,
    baseURL: process.env.BASE_URL || 'http://localhost:3000/api',
    retry: { retries: 3 },
  },
  // fontawesome: {
  //   component: 'fa',
  //   imports: [
  //     { icons: ['fas'], set: '@fortawesome/free-solid-svg-icons' }
  //   ]
  // },
  // bootstrapVue: { bootstrapCSS: false },
  // axios: { baseURL: process.env.AXIOS_BASE_URL || 'http://10.0.80.52:3000/' },
  server: { port: 3000, host: '0.0.0.0', timing: false },
  build: {
    babel: { compact: true },
    parallel: true,
    // cache: true,
    // extractCSS: production,
    // optimization: {
    //   splitChunks: {
    //     cacheGroups: {
    //       styles: { name: 'styles', test: /\.(css|vue)$/, chunks: 'all', enforce: true }
    //     }
    //   }
    // }
  },
}
