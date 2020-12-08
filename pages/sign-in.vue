<template>
  <c-simple-grid :columns="2">
    <c-box>
      <h2>
        SURVEY<br />
        POS SERVER
      </h2>
      <p>Login or register from here to access.</p>
    </c-box>
    <c-box>
      <c-heading as="h2" size="lg"> Sign-In </c-heading>
      <c-form-control>
        <c-form-label for="username">Central Account</c-form-label>
        <c-input
          id="username"
          type="text"
          aria-describedby="email-helper-text"
          placeholder="Enter email @central.co.th"
        />
        <c-form-helper-text id="email-helper-text">
          We'll never share your email.
        </c-form-helper-text>
      </c-form-control>
      <c-form-control>
        <c-form-label for="password">Password</c-form-label>
        <c-input
          id="password"
          type="password"
          aria-describedby="email-helper-text"
          placeholder="Enter password"
        />
      </c-form-control>
    </c-box>
  </c-simple-grid>
  <!-- <div>
     <div class="row sidenav d-none d-md-block">
      <div class="col-36 login-main-text">
        <h2>
          SURVEY<br />
          POS SERVER
        </h2>
        <p>Login or register from here to access.</p>
      </div>
    </div>
    <div class="row main">
      <c-stack :spacing="5">
        <c-box :p="5" shadow="md" border-width="1px">
        </c-box>
      </c-stack>

      <div class="col-36 col-lg-24 col-xl-20 col-login mx-auto">


        <div class="login-form">
          <form method="post" @submit.prevent="onLogin">
            <div class="form-group">
              <label>User or Email</label>
              <input
                v-model="username"
                type="text"
                class="form-control"
                placeholder="@central.co.th"
              />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input
                v-model="password"
                type="password"
                class="form-control"
                placeholder="Password"
              />
            </div>
            <button
              :disabled="submitted"
              type="submit"
              class="btn btn-success"
              v-text="submitted ? 'Please wait...' : 'Login'"
            />
          </form>
        </div>
      </div>
    </div>
   </div> -->
</template>

<script>
// import { CHeading, CStack } from '@chakra-ui/vue'

export default {
  auth: false,
  // components: { CHeading, CStack },
  data: () => ({
    username: '',
    password: '',
    submitted: false,
  }),
  created() {
    if (process.client && !this.$auth.user) this.$router.replace('/')
  },
  methods: {
    onLogin() {
      if (!this.username || !this.password) return
      this.submitted = true
      this.$auth
        .loginWith('local', {
          data: { user: this.username.trim(), pass: this.password },
        })
        .then(() => {
          if (this.$auth.loggedIn) {
            this.$router.replace('/')
          } else {
            this.submitted = false
            this.$toast.error('Username or Password worng.', { duration: 1000 })
          }
        })
        .catch((ex) => {
          this.submitted = false
          this.$router.replace('/')
          this.$toast.error(ex.message, { duration: 5000 })
          console.log(ex)
        })
    },
  },
}
</script>
