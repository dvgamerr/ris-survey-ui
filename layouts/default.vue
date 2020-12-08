<template>
  <div class="container">
    <CThemeProvider>
      <CColorModeProvider v-slot="{ colorMode }">
        <CBox
          as="main"
          :bg="colorMode === 'light' ? 'white' : 'gray.800'"
          :color="colorMode === 'light' ? 'black' : 'whiteAlpha.900'"
        >
          <CReset />
          <Navbar />
          <CBox as="main" :px="[4, 10, '12rem']">
            <Nuxt />
          </CBox>
        </CBox>
      </CColorModeProvider>
    </CThemeProvider>
  </div>
</template>

<script>
import {
  CThemeProvider,
  CColorModeProvider,
  CBox,
  CReset,
} from '@chakra-ui/vue'
// import navigation from '~/components/navigation.vue'

export default {
  components: {
    CThemeProvider,
    CColorModeProvider,
    CBox,
    CReset,
  },
}
</script>

<style></style>
