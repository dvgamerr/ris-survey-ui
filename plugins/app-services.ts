import axios from 'axios'
import { reactive } from 'vue'

type User = Record<string, unknown> & {
  name?: string
  user_name?: string
  user_level?: number
}

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()
  const session = useCookie<{ token: string; user: User } | null>('ris-session', {
    sameSite: 'lax',
  })
  const client = axios.create({ baseURL: config.public.apiBase })

  const auth = reactive({
    loggedIn: Boolean(session.value?.token),
    user: (session.value?.user || {}) as User,
    async loginWith(_strategy: string, options: { data: Record<string, unknown> }) {
      const { data } = await client.post('/auth/login', options.data)
      if (!data?.token || data?.error) {
        throw new Error(data?.error || 'Authentication failed')
      }

      client.defaults.headers.common.Authorization = `Bearer ${data.token}`
      const userResponse = await client.get('/auth/user')
      this.user = userResponse.data?.user || {}
      this.loggedIn = true
      session.value = { token: data.token, user: this.user }

      if (import.meta.client) {
        window.localStorage.setItem('auth._token.local', `Bearer ${data.token}`)
      }
    },
    async logout() {
      try {
        await client.post('/auth/logout')
      } finally {
        this.loggedIn = false
        this.user = {}
        session.value = null
        delete client.defaults.headers.common.Authorization
        if (import.meta.client) {
          window.localStorage.removeItem('auth._token.local')
        }
        await nuxtApp.runWithContext(() => navigateTo('/sign-in'))
      }
    },
  })

  if (session.value?.token) {
    client.defaults.headers.common.Authorization = `Bearer ${session.value.token}`
  }

  return {
    provide: {
      auth,
      axios: client,
    },
  }
})
