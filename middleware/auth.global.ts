export default defineNuxtRouteMiddleware((to) => {
  const { $auth } = useNuxtApp()

  if (to.path === '/sign-in') {
    return $auth.loggedIn ? navigateTo('/') : undefined
  }

  if (!$auth.loggedIn) {
    return navigateTo('/sign-in')
  }
})
