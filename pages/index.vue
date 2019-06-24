<template>
  <div class="container pt-5 pb-3">
    <no-ssr>
      <b-row>
        <div class="col-sm-2 col-md-25">
          <h2>All Survey CheckLists :</h2>
          <small class="title">sort by date modified and lastest 100 rows.</small>
          <br><br>
          <div v-for="(e, i) in tasks" :key="e.row" class="category-list">
            <div class="row">
              <div class="col-sm-25">
                <button
                  type="button"
                  class="btn btn-sm btn-icon"
                  @click.prevent="onDelete(e.nTaskId)"
                >
                  <fa icon="trash-alt"/>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-icon"
                  @click.prevent="onEdit(e.nTaskId)"
                >
                  <fa icon="edit"/>
                </button>
                <a
                  href="list/"
                  @click.prevent="onView(e.nTaskId)"
                  v-text="`${i+1}. ${e.sTitleName}`"
                />
              </div>
              <div class="text-right">
                <small
                  v-text="`${(e.nType) == '1' ? ' last created : ' : 'recent use : '} ${toTime(e.dCreated)}`"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-11">
          <br>
          <a href="new/">
            <b-button type="button" variant="outline-primary">Add New Title +</b-button>
          </a>
        </div>
      </b-row>
    </no-ssr>
  </div>
</template>
<script>
import moment from "moment";

export default {
  data: () => ({
    editor: false,
    tasks: []
  }),
  async asyncData({ redirect, params, $axios }) {
    let { data } = await $axios("/api/history/home")
    return { tasks: data }
  },
  methods: {
    onView(e) {
      this.$router.push({ name: "task-no", params: { no: e } })
    },
    toTime(datetime) {
      return moment(datetime).fromNow()
    },
    onEdit(e) {
      this.editor = true
      this.$router.push({ name: "edit-id", params: { id: e } })
    },
    onDelete(e) {
      if (confirm("Are you sure to Delete ?")) {
        this.$router.push({ name: "del-id", params: { id: e } })
      } else {
        this.$router.push("/")
      }
    }
  }
};
</script>
<style>
button[type="button"] {
  font-weight: bold;
  padding-left: 10px;
  padding-right: 10px;
}
.btn-icon {
  font-size: 11px;
  padding: 0rem 0.1rem;
  margin-top: -2px;
}
.col-sm-25 {
  font-size: 22px;
}
h2{
    margin: -1px;
    padding: 0px;
}
</style>
