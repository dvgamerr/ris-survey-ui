<template>
  <div class="container pt-5 pb-3">
    <no-ssr>
      <b-row>
        <div class="col-sm-2 col-md-25">
          <h2>All Servey CheckList :</h2>
          <div v-for="(e, i) in tasks" :key="e.row" class="category-list">
            <div class="row">
              <div class="col-sm-26">
                <button type="button" class="btn btn-sm btn-icon" @click.prevent="onDelete(e.nTaskId)">
                  <fa icon="trash-alt" />
                </button>
                <button type="button" class="btn btn-sm btn-icon" @click.prevent="onEdit(e.nTaskId)">
                  <fa icon="edit" />
                </button>
                <a href="list/" @click.prevent="onView(e.nTaskId)" v-text="`${i+1}. ${e.sTitleName}`"/>
              </div>
              <div class="col text-right">
                <small v-text="`recent ${(e.nType) == '1' ? 'created' : 'used'} ${toTime(e.dCreated)}`"/>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-11">
          <a href="new/">
            <b-button type="button" variant="outline-primary">Add New Title +</b-button>
          </a>
        </div>
      </b-row>
    </no-ssr>
  </div>
</template>
<script>
import moment from "moment"

export default {
  data: () => ({
    editor: false,
    tasks: []
  }),
  async asyncData({ redirect, params, $axios }) {
    let { data } = await $axios("/api/history/home/")
    return { tasks: data }
  },
  methods: {
    onView(e) {
      this.$router.push({ name: "task-no", params: { no: e } })
    },
    toTime(datetime) {
      // 
      return moment.utc(datetime).format("DD/MM/YYYY HH:mm")
    },
    onEdit(e) {
      this.editor = true;
      this.$router.push({ name: "edit-id", params: { id: e } });
    },
    onDelete(e) { //ยังไม่ได้set
      let vm = this;
      this.editor = true;
      let index = -1;
      let item = this.history.filter((a, i) => {
        if (a.sKey === e) index = i;
        return a.sKey === e;
      });
      // console.log(index, item)
      // if (item.length > 1) return this.$toast.error(`${item.length} Tasks can't remove.`)
      this.history.splice(item, 1);
      vm.$axios
        .post("/api/history/del/" + e)
        .then(() => {
          vm.$toast.success("Task Delete");
          // vm.$router.go()
        })
        .catch(ex => {
          vm.$toast.error(ex.message);
        });
    }
  }
}
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
.col-sm-26{
  font-size: 22px;
}
</style>
