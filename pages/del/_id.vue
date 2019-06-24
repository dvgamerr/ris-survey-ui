<template>
  <div class="container pt-5 pb-3">
    <no-ssr>
      <div class="col-sm-36">
        <h3>Redirect..</h3>
        {{ taskKey }}
        <br>
        <small>if not direct click this button to delete.</small>
        <br>
        <b-button @click="onSubmit" variant="danger" v-text="Delete ? 'Approving...' : 'Delete !'"/>
      </div>
    </no-ssr>
  </div>
</template>

<script>
export default {
  data: () => ({
    taskKey: null,
    submited: false
  }),
  async asyncData({ redirect, params, $axios }) {
    if (params.id) {
      let sKey = parseInt(params.id)
      if (sKey == NaN) return redirect("/")
      let { data } = await $axios("/api/history/index/" + params.id)
      return { taskKey: params.id }
    }
  },
  created: function() {
    this.onSubmit()
  },
  methods: {
    onSubmit() {
      let taskKey = this.taskKey
      let vm = this
      let data = vm.tasks
      this.submited = true
      vm.$axios
        .post("/api/history/del", {
          key: vm.taskKey
        })
        .then(({ data }) => {
          if (data.success) {
            vm.$toast.error("Delete it!")
            vm.$router.push("/")
          }
          this.submited = false
        })
        .catch(ex => {
          vm.$toast.error(ex.message)
          this.submited = false
        })
    }
  }
}
</script>
