<template>
  <div class="container pt-5 pb-3">
    <no-ssr>
      <b-row>
        <div class="col-sm-2 col-md-25">
          <h2>All Title Survey Checklists</h2>
          <small
            >That is sorted by date modified and shown the lastest 100
            rows.</small
          >
          <br /><br />
          <div v-for="(e, i) in tasks" :key="e.row" class="category-list">
            <div class="row">
              <div class="col-sm-25">
                <button
                  type="button"
                  class="btn btn-sm btn-icon"
                  @click.prevent="onDelete(e.nTaskId, i)"
                >
                  <fa icon="trash-alt" />
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-icon"
                  @click.prevent="onEdit(e.nTaskId)"
                >
                  <fa icon="edit" />
                </button>
                <a
                  href="list/"
                  @click.prevent="onView(e.nTaskId)"
                  v-text="`${i + 1}. ${e.sTitleName}`"
                />
              </div>
              <div class="text-right">
                <small
                  v-text="
                    `${
                      e.nType == '1' ? ' last created ' : 'recent use '
                    } ${toTime(e.sCreated)}`
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-11">
          <br />
          <a href="new/">
            <b-button type="button" class="new-button" variant="outline-primary"
              >Add New Title +</b-button
            >
          </a>
        </div>
      </b-row>
    </no-ssr>
  </div>
</template>
<script>
import moment from 'moment'

export default {
  async asyncData({ $axios, params }) {
    let item = { data: [] }
    if (!params.no) {
      item = await $axios('/api/history/home')
    }
    return { tasks: item.data }
  },
  data: () => ({
    editor: false,
    tasks: [],
  }),
  methods: {
    onView(e) {
      this.$router.push({ name: 'task-no', params: { no: e } })
    },
    toTime(datetime) {
      return moment(datetime).fromNow()
    },
    onEdit(e) {
      this.editor = true
      this.$router.push({ name: 'edit-id', params: { id: e } })
    },
    onDelete(e, i) {
      if (confirm('Are you sure you want to delete this item ?')) {
        const vm = this
        this.tasks.splice(i, 1)
        this.$axios
          .post('/api/history/home/' + e)
          .then(({ data }) => {
            if (data.success) {
              vm.$toast.error('Delete it!')
            }
          })
          .catch((ex) => {
            vm.$toast.error(ex.message)
          })
      } else {
        this.$router.push('/')
      }
    },
  },
}
</script>
<style>
.new-button {
  font-weight: bold;
  padding-left: 10px;
  padding-right: 10px;
}
.btn-icon {
  padding-left: -10px;
  padding-right: -10px;
  margin-left: -2px;
  margin-right: -2px;
  margin-bottom: 2px;
}
.col-sm-25 {
  font-size: 22px;
}
h2 {
  margin: -1px;
  padding: 0px;
}
.text-right {
  line-height: 35px;
}
</style>
