<template>
  <div class="container pt-5 pb-3">
    <no-ssr>
      <b-row>
        <div class="col-md-25">
          <h3>All List :</h3>
          <div v-for="(e, i) in tasks" :key="e.nTaskId" class="category-list">
            <a href="list/" @click.prevent="onView(e.nTaskId)">
              <h4>{{ (i + 1) }}. {{ e.sTitleName }}</h4>
            </a>
          </div>
        </div>
        <div class="col-md-11">
          <a href="new/">
            <b-button variant="outline-primary">
              <b>&nbsp;&nbsp; Add New Title + &nbsp;&nbsp;</b>
            </b-button>
          </a>
        </div>
      </b-row>
    </no-ssr>
  </div>
</template>
<script>
export default {
  data: () => ({
    taskKey: null,
    editor: "Guest",
    tasks: []
  }),
  async asyncData({ redirect, params, $axios }) {
    let { data } = await $axios("/api/history/home/1");
    return { tasks: data.tasks, taskKey: null };
  },
  methods: {
    onView(e) {
      this.$router.push({ name: "task-no", params: { no: e } });
    }
  }
};
</script>