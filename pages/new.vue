<template>
  <div class="container pt-5 pb-3">
    <no-ssr>
      <div>
        <b-form @submit.prevent="onSubmit" @reset.prevent="onReset">
          <div class="col-sm-36">
            <b-row>
              <b-col sm="4">
                <h3>Title :</h3>
              </b-col>
              <b-col sm="31">
                <b-form-input placeholder="Enter your Title"></b-form-input>
              </b-col>
              <b-col>
                <b-button variant="success" @click="addNewlist">Add new list +</b-button>
              </b-col>
            </b-row>
            <hr>
          </div>
          <div class="row mb-5 pb-5">
            <div class="col-sm-36" v-for="(item, i) in list" :key="i">
              <b-container fluid>
                <span class="float-right" @click="delNewlist" style="cursor:pointer">X</span>
                <div class="list-form">
                  <b-row>
                    <b-col sm="3">
                      <label class="card-title">{{(i+1)}}.</label>
                    </b-col>
                    <b-col sm="9">
                      <b-form-input
                        type="text"
                        class="sublist-form"
                        v-model="item.id"
                        placeholder="Enter your List"
                      ></b-form-input>
                    </b-col>
                  </b-row>
                </div>
              </b-container>
            </div>
            <div class="survey-submit">
              <div class="container">
                <div class="row">
                  <div class="col-md-18"></div>
                  <div class="col-md-18 text-right">
                    <b-button
                      type="submit"
                      :disabled="submited"
                      variant="primary"
                      v-text="submited ? 'Approving...' : taskKey = 'Submit'"
                    />
                    <b-button
                      v-if="!taskKey"
                      type="reset"
                      :disabled="submited"
                      variant="danger"
                    >Reset</b-button>
                    <nuxt-link
                      v-else
                      tag="button"
                      to="/"
                      type="button"
                      class="btn btn-secondary"
                    >Back</nuxt-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </b-form>
      </div>
    </no-ssr>
  </div>
</template>

<script>
import moment from "moment";
export default {
  data: () => ({
    taskKey: null,
    submited: false,
    current: moment(),
    list: [
      {
        id: ""
      }
    ],
    tasks: []
  }),
  computed: {
    getTaskDateTime() {
      return moment(this.taskKey, "YYYYMMDDHHmmssSSS").format(
        "DD MMMM YYYY HH:mm:ss"
      );
    },
    getDateTime() {
      return this.current.format("DD MMMM YYYY HH:mm:ss");
    },
    getTaskUncheck() {
      return this.tasks.length - this.getTaskSuccess - this.getTaskProblem;
    },
    getTaskSuccess() {
      return this.tasks.filter(e => e.selected).length;
    },
    getTaskProblem() {
      return this.problem;
    }
  },
  async asyncData({ redirect, params, $axios }) {
    if (params.id) {
      let sKey = parseInt(params.id);

      if (sKey == NaN) return redirect("/history");
      let { data } = await $axios("/api/history/" + params.id);

      if (!data.records) return redirect("/history");
      return { editor: data.editor, tasks: data.records, taskKey: params.id };
    }
    if (params.no) {
      let sKey = parseInt(params.no);
      if (sKey == NaN) return redirect("/history");
      else {
        let { data } = await $axios("/api/history/detail/" + params.no);
        return { title: data.title, tasks: data.tasks, taskKey: null };
      }
    }
  },
  methods: {
    onSave() {
      if (!this.taskKey && process.client && this.tasks) {
        this.$nextTick(
          (() => {
            window.localStorage.setItem(
              "survey.tasks",
              JSON.stringify(this.tasks)
            );
          }).bind(this)
        );
      }
    },
    onReset() {
      if (!this.taskKey) {
        for (const e of this.tasks) {
          e.newSubList = "";
        }
        this.$forceUpdate();
        if (process.client && this.tasks)
          window.localStorage.removeItem("survey.tasks");
      }
    },
    onSubmit() {
      let vm = this;
      let data = vm.tasks.map(e => {
        return {
          nTaskDetailId: e.nTaskDetailId,
          nOrder: e.nOrder,
          sSubject: e.sSubject,
          selected: e.selected,
          status: e.problem ? e.status : "",
          problem: e.problem || false,
          reason: e.problem ? e.reason : ""
        };
      });
      this.submited = true;
      vm.$axios
        .post("/api/history/submit", {
          key: vm.taskKey,
          username: vm.$auth.user.user_name,
          name: vm.$auth.user.name,
          tasks: vm.tasks
        })
        .then(({ data }) => {
          if (data.success) {
            if (!this.taskKey) {
              vm.$toast.success("Thanks.");
              vm.onReset();
            } else {
              vm.$toast.success("Task Updated.");
              vm.$router.push("/history");
            }
          } else {
            vm.$toast.error("Error API");
          }
          this.submited = false;
        })
        .catch(ex => {
          vm.$toast.error(ex.message);
          this.submited = false;
        });
    },
    addNewlist() {
      this.list.push({
        id: ""
      });
    },
    delNewlist(i) {
      this.list.splice(i, 1);
    }
  }
};
</script>

<style>
button[type="submit"] {
  min-width: 120px;
}
.survey-submit {
  position: fixed;
  padding: 25px;
  width: 100vw;
  bottom: 0px;
  left: 0px;
  min-height: 80px;
  background-color: #f8f9fa;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}
</style>