<template>
  <div class="container pt-5 pb-3">
    <no-ssr>
      <div>
        <b-form @submit.prevent="onSubmit" @reset.prevent="onReset">
          <div class="col-sm-36">
            <b-row>
              <b-col sm="4">
                <h3>Title:</h3>
              </b-col>
              <b-col sm="28">
                <b-form-input
                  v-model="titleName"
                  placeholder="Enter your Title"
                  maxlength="50"
                  required
                  tabindex="1"
                  autofocus
                />
              </b-col>
            </b-row>
            <b-row>
              <b-button
                type="button"
                size="ssm"
                :variant="'outline-info'"
                tabindex="3"
                @click="addNewlist"
                v-text="'Add new list +'"
              />
              <small v-if="taskKey" class="time"><b>created : </b>{{ getThisDateTime(dCreated) }}</small>
            </b-row>
            <hr>
          </div>
          <div class="row mb-5 pb-5">
            <div v-for="(e, i) in tasks" :key="i" class="col-sm-36">
              <div class="list-form">
                <b-row class="justify-content-md-center">
                  <b-col sm="1">
                    <label class="card-title" v-text="`${(i+1)}.`" />
                  </b-col>
                  <b-col sm="15">
                    <b-form-input
                      v-model="e.sSubject"
                      :state="valid"
                      type="text"
                      class="sublist-form"
                      size="sm"
                      placeholder="Enter your List"
                      maxlength="50"
                      tabindex="2+`${(i+1)}.`"
                    />
                    <b-form-textarea
                      v-model="e.sDescription"
                      class="sublist-form"
                      size="sm"
                      placeholder="Enter your Description"
                      maxlength="500"
                      tabindex="2+`${(i+1)}.`"
                      rows="2"
                    />
                  </b-col>
                  <b-col sm="1">
                    <b-button v-if="i>0" size="sm" variant="danger" @click="delNewlist(i)">
                      <fa icon="times" />
                    </b-button>
                  </b-col>
                </b-row>
                <br>
              </div>
            </div>
            <div class="survey-submit">
              <div class="container">
                <div class="row">
                  <div class="col-md-18" />
                  <div class="col-md-18 text-right">
                    <b-button
                      type="submit"
                      :disabled="submited"
                      variant="primary"
                      tabindex="3"
                      v-text="submited ? 'Approving...' : taskKey ? 'Save' : 'Submit'"
                    />
                    <b-button
                      v-if="!taskKey"
                      type="reset"
                      :disabled="submited"
                      variant="danger"
                      tabindex="4"
                    >
                      Reset
                    </b-button>
                    <nuxt-link
                      v-else
                      tag="button"
                      to="/"
                      type="button"
                      class="btn btn-secondary"
                      tabindex="4"
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
    valid: null,
    titleName: "",
    tasks: [{sSubject: "", sDescription: ""},{sSubject: "", sDescription: ""},{sSubject: "", sDescription: ""}]
    //input 3 box.
  }),
  async asyncData({ redirect, params, $axios }) {
    if (params.id) {
      let sKey = parseInt(params.id)
      
      if (sKey == NaN) return redirect("/history")
      let { data } = await $axios("/api/history/new/" + params.id)
      return { titleName: data.titleName, tasks: data.tasks, taskKey: params.id, editor: data.editor, dCreated: data.dCreated }
    }
  },

  methods: {
    getThisDateTime(datetime) {
      return moment(datetime).format("DD MMMM YYYY [ - ] HH:mm")
     },
    onReset() {
      if (!this.taskKey) {
        this.titleName = ""
        this.tasks.length = 3
        for (const e of this.tasks) {
          e.sSubject = ""
          e.sDescription = ""
        }
      }
    },
    onSubmit() {
      let array = []
      let set = new Set()
      this.tasks.forEach(element => {
        if (element.sSubject == "".trim()){
        return this.valid = false
        }
        array.push(element.sSubject.trim())
        set.add(element.sSubject.trim())
      })
      if (set.size!==array.length) {
        this.valid = false
        alert("List is same !")
      }
      else {
      let taskKey = this.taskKey 
      let vm = this
      let data = vm.tasks
      if (!taskKey) {
      this.submited = true
      vm.$axios.post("/api/history/new", {
        key: vm.taskKey,
        tasks: vm.tasks,
        titleName: vm.titleName
      }).then(({ data }) => {
        if (data.success) {
          vm.$toast.success("This CheckList is Created.")
          vm.$router.push("/")
        } else {
          vm.$toast.error(data.error)
        }
        this.submited = false
      }).catch(ex => {
        vm.$toast.error(ex.message)
        this.submited = false
      })
      }else{
        this.valid = true
        this.submited = true
        vm.$axios.post("/api/history/new", {
        key: vm.taskKey,
        tasks: vm.tasks,
        titleName: vm.titleName
      }).then(({ data }) => {
        if (data.success) {
          vm.$toast.success("This CheckList is Updated!")
          vm.$router.push("/")
        } else {
          vm.$toast.error(data.error == "Don't use space !" || "This Title is use already!" ? data.error : 'Error API')
        }
        this.submited = false
      }).catch(ex => {
        vm.$toast.error(ex.message)
        this.submited = false
      })
      }}
    },
    addNewlist() {
      this.tasks.push({})
    },
    delNewlist(i) {
      this.tasks.splice(i, 1)
    },
  }
}
</script>

<style>
small.time{
  padding-left: 48px;
}
/* button[type="submit"] {
  min-width: 120px;
} */
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