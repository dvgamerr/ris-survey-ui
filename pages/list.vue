<template>
  <div class="container pt-5 pb-3">
    <no-ssr>
      <div>
        <b-form @submit.prevent="onSubmit" @reset.prevent="onReset">
          <div v-if="taskKey" class="row">
            <div class="col-sm-36">
              <h3>History Survey</h3>
              <small>
                by
                <b>{{ editor }}</b>
                at {{ getTaskDateTime }}
              </small>
              <hr>
            </div>
          </div>
          <div v-else class="row">
            <div class="col-sm-36">
              <h3>{{ title }} {{ sMenu }}</h3>
              <small v-if="!taskKey"><b>created :</b> {{ getThisDateTime(dCreated) }}
                <b>modified :</b> {{ getThisDateTime(dModified) }}<br></small>
              <!--checked All button-->
              <b-button
                type="button"
                size="ssm"
                :variant="tasks.length !== tasks.filter(e => e.selected).length ? 'outline-info' : 'outline-secondary'"
                @click="onCheckAll"
                v-text="tasks.length !== tasks.filter(e => e.selected).length ? 'Checked All' : 'Unchecked All'"
              />
              <hr>
            </div>
          </div>
          <div class="row mb-5 pb-5">
            <div class="col-sm-36">
              <div v-for="(e, i) in tasks" :key="e.nTaskDetailId">
                <b-form-group :label-for="'chkTaskList' + e.nTaskDetailId">
                  <!--checkbox-->
                  <b-form-checkbox
                    :id="'chkTaskList' + e.nTaskDetailId"
                    v-model="e.selected"
                    :disabled="e.problem"
                    switch
                    required
                    class="tasklist"
                    name="check-button"
                    @change="onChange"
                  >
                    <!--problem button-->
                    <b-button
                      class="problem"
                      type="button"
                      size="sm"
                      :variant="!e.problem ? 'outline-secondary' : 'outline-danger'"
                      @click="onReason(e)"
                      v-text="!e.problem ? 'Problem' : 'Cancel'"
                    />
                    <b class="checker-text">
                      <span v-text="(i + 1) + '. ' + e.sSubject" />
                    </b>
                    <!--Label-->
                    <span class="checker-text d-none d-md-inline" v-html="e.sDetail" />
                    <div v-if="e.problem">
                      <!--problem-->
                      <div>
                        <span class="badge badge-light">STATUS :</span>
                        <b-button
                          :class="[ 'status', e.status === 'FAIL' ? 'active' : '' ]"
                          type="button"
                          size="sm"
                          :variant="e.status === 'FAIL' ? 'outline-danger' : 'outline-secondary'"
                          @click.prevent="onStatus(e, 'FAIL')"
                          v-text="'FAIL'"
                        />
                        <b-button
                          :class="[ 'status', e.status === 'WARN' ? 'active' : '' ]"
                          type="button"
                          size="sm"
                          :variant="e.status === 'WARN' ? 'outline-warning' : 'outline-secondary'"
                          @click.prevent="onStatus(e, 'WARN')"
                          v-text="'WARN'"
                        />
                        <b-button
                          :class="[ 'status', e.status === 'INFO' ? 'active' : '' ]"
                          type="button"
                          size="sm"
                          :variant="e.status === 'INFO' ? 'outline-info' : 'outline-secondary'"
                          @click.prevent="onStatus(e, 'INFO')"
                          v-text="'INFO'"
                        />
                      </div>
                      <!--msg in problem box-->
                      <b-form-textarea
                        id="txtReason"
                        v-model="e.reason"
                        class="mt-3 reason"
                        :required="e.problem"
                        size="sm"
                        maxlength="500"
                        placeholder="Enter your problem at least 5 characters"
                        rows="2"
                        @change="onChange"
                      />
                    </div>
                    <div v-else />
                  </b-form-checkbox>
                </b-form-group>
              </div>
              <div v-if="tasks.length === 0" class="text-center">No Transaction</div>
            </div>
            <div class="survey-submit">
              <div class="container">
                <div class="row">
                  <div class="col-md-18">
                    <div v-if="!taskKey">
                      <span>
                        <b>Pass:</b>
                        {{ getTaskSuccess }}
                      </span>
                      <span>
                        <b>Fail:</b>
                        {{ getTaskProblem }}
                      </span>
                      <span
                        :class="getTaskUncheck ? 'text-danger' : ''"
                      >{{ !getTaskUncheck ? '' : `[ ${getTaskUncheck} Uncheck(s) ]` }}</span>
                    </div>
                  </div>
                  <div class="col-md-18 text-right">
                    <b-button
                      type="submit"
                      :disabled="submited"
                      variant="primary"
                      v-text="submited ? 'Approving...' : taskKey ? 'Save' : 'Submit'"
                    />
                    <b-button
                      v-if="!taskKey"
                      type="reset"
                      :disabled="submited"
                      variant="danger"
                    >
                      Reset
                    </b-button>
                    <nuxt-link
                      v-else
                      tag="button"
                      to="/history"
                      type="button"
                      class="btn btn-secondary"
                    >
                      Back
                    </nuxt-link>
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
import moment from "moment"
export default {
  data: () => ({
    taskKey: null,
    editor: "Guest",
    submited: false,
    current: moment(),
    problem: 0,
    title: "",
    dCreated: "",
    tasks: []
  }),
  computed: {
    getTaskDateTime() {
      return moment(this.taskKey, "YYYYMMDDHHmmssSSS").format(
        "DD MMMM YYYY HH:mm:ss"
      )
    },
    getDateTime() {
      return this.current.format("DD MMMM YYYY HH:mm:ss")
    },
    getTaskUncheck() {
      return this.tasks.length - this.getTaskSuccess - this.getTaskProblem
    },
    getTaskSuccess() {
      return this.tasks.filter(e => e.selected).length
    },
    getTaskProblem() {
      return this.problem
    }
  },
  async asyncData({ redirect, params, $axios }) {
    if (params.id) {
      let sKey = parseInt(params.id)

      if (isNaN(sKey)) return redirect("/history")
      let { data } = await $axios("/api/history/" + params.id)

      if (!data.records) return redirect("/history")
      return { editor: data.editor, tasks: data.records, taskKey: params.id }
    }
    if (params.no) {
      let sKey = parseInt(params.no)
      if (isNaN(sKey)) return redirect("/history")
      else {
        let { data } = await $axios("/api/history/list/" + params.no)
        return { title: data.title, dCreated: data.dCreated, tasks: data.tasks, taskKey: null, dModified: data.dModified }
      }
    }
  },
  created() {
    if (!this.taskKey) {
      setInterval(
        (() => {
          this.current = moment()
        }).bind(this),
        500
      )
      if (process.client) {
        let survey = window.localStorage.getItem("survey.tasks")
        if (survey) {
          survey = JSON.parse(survey)
          if (
            this.tasks.length === survey.length &&
            survey.filter(s => s.reason !== "" || s.selected).length > 0
          )
            this.tasks = survey
          this.problem = 0
          for (const i of this.tasks) {
            this.problem += i.problem ? 1 : 0
          }
          this.$forceUpdate()
        }
      }
    }
  },
  methods: {
    getThisDateTime(datetime) {
      return moment(datetime).format("DD MMMM YYYY [ - ] HH:mm")
    },
    onSave() {
      if (!this.taskKey && process.client && this.tasks) {
        this.$nextTick(
          (() => {
            window.localStorage.setItem(
              "survey.tasks",
              JSON.stringify(this.tasks)
            )
          }).bind(this)
        )
      }
    },
    onCheckAll() {
      let checkAll =
        this.tasks.length === this.tasks.filter(e => e.selected).length
      if (checkAll) return this.onReset()

      for (const e of this.tasks) {
        e.selected = true
        e.problem = false
        e.reason = ""
        e.status = ""
      }
      this.problem = 0
      this.$forceUpdate()
      this.onSave()
    },
    onReset() {
      if (!this.taskKey) {
        this.problem = 0
        for (const e of this.tasks) {
          e.selected = false
          e.problem = false
          e.reason = ""
          e.status = ""
        }
        this.$forceUpdate()
        if (process.client && this.tasks)
          window.localStorage.removeItem("survey.tasks")
      }
    },
    onSubmit() {
      let vm = this
      this.submited = true
      vm.$axios.post("/api/history/submit", {
        key: vm.taskKey,
        username: vm.$auth.user.user_name,
        name: vm.$auth.user.name,
        tasks: vm.tasks
      }).then(({ data }) => {
        if (data.success) {
          if (!this.taskKey) {
            vm.$toast.success("Thanks.")
            vm.onReset()
            vm.$router.push("/history")
          } else {
            vm.$toast.success("Task Updated.")
            vm.$router.push("/history")
          }
        } else {
          vm.$toast.error("Error API")
        }
        this.submited = false
      }).catch(ex => {
        vm.$toast.error(ex.message)
        this.submited = false
      })
    },
    onReason(e) {
      e.selected = false
      e.problem = !e.problem
      if (!e.status) e.status = e.problem ? "FAIL" : ""
      if (!e.problem) e.status = ""
      this.$forceUpdate()

      this.problem = 0
      for (const i of this.tasks) {
        this.problem += i.problem ? 1 : 0
      }
      if (this.taskKey) return
      this.onSave()
    },
    onChange() {
      this.$forceUpdate()
      if (this.taskKey) return
      this.onSave()
    },
    onStatus(e, text) {
      e.status = text
      this.$forceUpdate()
      if (this.taskKey) return
      this.onSave()
    }
  }
}
</script>

<style>
.checker-text {
  font-family: "Segoe UI";
  font-size: 13px;
}
button.status {
  width: 40px;
  padding: 0px;
  font-size: 10px;
  font-weight: bold;
}
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
h3{
    margin: -1px;
    padding: 0px;
}
</style>
