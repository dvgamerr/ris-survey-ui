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
              <b-col sm="31">
                <b-form-input
                  v-model="titleName"
                  placeholder="Enter your Title"
                  maxlength="50"
                  required
                  tabindex="1"
                  autofocus
                /><span class="required">*required</span>
              </b-col>
              </b-row>
              <b-row>
              <b-button
                type="button"
                size="ssm"
                :variant="'outline-info'"
                @click="addNewlist"
                tabindex="3"
                v-text="'Add new list +'"
              />
              <small v-if="taskKey" v-text="`created : ${getThisDateTime(dCreated)}`"/>
            </b-row>
            <hr>
          </div>
          <div class="row mb-5 pb-5">
            <div v-for="(e, i) in tasks" :key="i" class="col-sm-36">
                <div class="list-form">
                  <b-row class="justify-content-md-center">
                    <b-col sm="1">
                      <label class="card-title" v-text="`${(i+1)}.`"/>
                    </b-col>
                    <b-col sm="20">
                      <span class="required">*required list</span>
                      <b-form-input
                        v-model="e.sSubject"
                        type="text"
                        class="sublist-form"
                        size="sm"
                        placeholder="Enter your List"
                        maxlength="50"
                        tabindex="2+`${(i+1)}.`"
                        required
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
                      <br>
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
    // current: moment(),
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

  //   created() { //แก้ให้SAVE inputbox
  //   if (!this.taskKey) {
  //     setInterval(
  //       (() => {
  //         this.current = moment();
  //       }).bind(this),
  //       500
  //     );
  //     if (process.client) {
  //       let survey = window.localStorage.getItem("survey.tasks");
  //       if (survey) {
  //         survey = JSON.parse(survey);
  //         if (
  //           this.tasks.length === survey.length && (this.titleName !== "").length > 0 &&
  //           survey.filter(s => s.sSubject !== "" || s.sDescription !== "").length > 0
  //         )
  //         this.tasks = survey;
  //         this.$forceUpdate();
  //       }
  //     }
  //   }
  // },
  
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
        // this.$forceUpdate()
        // if (process.client && this.tasks)
        //   window.localStorage.removeItem("survey.tasks")
      }
    },
    onSubmit() {
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
      }
    },
    addNewlist() {
      this.tasks.push({})
    },
    delNewlist(i) {
      this.tasks.splice(i, 1)
    },

// onChange(){
// this.$forceUpdate()
// if (this.taskKey) return
// this.onSave()
// },
//     onSave() {
//       if (!this.taskKey && process.client && this.tasks) {
//         this.$nextTick(
//           (() => {
//             window.localStorage.setItem(
//               "survey.tasks",
//               JSON.stringify(this.tasks)
//             )
//           }).bind(this)
//         )
//       }
//     },
  }
}
</script>

<style>
small{
  padding-left: 48px;
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
span.required{
  color: red;
  font-size: 11px;
}
</style>