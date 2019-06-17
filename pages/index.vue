<template>
  <div class="container pt-5 pb-3">
    <no-ssr>
      <b-row>
        <div class="col-md-25">
          <h3>All List :</h3>
          <div v-for="(e, i) in tasks" :key="e.nTaskId" class="category-list">
            <div class="row">
              <div class="col">
                <h4>
                  <a
                    href="list/"
                    @click.prevent="onView(e.nTaskId)"
                  >{{ (i + 1) }}. {{ e.sTitleName }}</a>
                </h4>
              </div>
              <div class="col">
                <small>created: {{ toTime(e.dCreated) }}</small>
              </div>
            </div>
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
import moment from "moment";
import "moment/locale/th";
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
    },
    toTime(datetime) {
      return moment.utc(datetime).format("DD/MM/YYYY HH:mm");
      // return moment(datetime).fromNow();
    }
  }
};
</script>