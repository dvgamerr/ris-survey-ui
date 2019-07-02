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
                  @change="onChange"
                />
              </b-col>
            </b-row>
            <b-row>
              <small v-if="taskKey" class="time"><b>created : </b>{{ getThisDateTime(dCreated) }}</small>
            </b-row>
            <hr>
          </div>
          <div>
            <draggable tag="ul" :list="tasks" handle=".handle">
              <li v-for="(e, i) in tasks" :key="i" class="list-group-item">
                <div class="col-sm-36">
                  <b-row>
                    <b-col sm="5">
                      <i v-if="tasks.length > 1" class="handle" size="sm">
                        <fa icon="align-justify" />
                      </i>
                      <span class="no-title" v-text="`${(i+1)}. `" />
                    </b-col>
                    <b-col sm="25">
                      <b-form-input
                        v-model="e.sSubject"
                        :state="e.valid"
                        type="text"
                        class="form-control"
                        size="sm"
                        placeholder="Enter your List"
                        maxlength="50"
                        tabindex="2+`${(i+1)}.`"
                      />
                      <b-form-textarea
                        v-model="e.sDescription"
                        class="form-control"
                        size="sm"
                        placeholder="Enter your Description"
                        maxlength="500"
                        tabindex="2+`${(i+1)}.`"
                        rows="2"
                      />
                    </b-col>
                    <b-col sm="1">
                      <b-button v-if="tasks.length > 1" class="closebox" size="sm" variant="danger" @click="delNewlist(i)">
                        <fa icon="times" />
                      </b-button>
                    </b-col>
                  </b-row>
                </div>
              </li>
            </draggable>
            <div class="col-sm-36">
              <b-row class="row justify-content-md-center">
                <b-col sm="16" />
                <b-col>
                  <b-button
                    type="button"
                    size="ssm"
                    :variant="'outline-info'"
                    tabindex="3"
                    @click="addNewlist"
                    v-text="'add new list +'"
                  />
                  <br><br><br><br>
                </b-col>
                <b-col sm="12" />
              </b-row>
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
                  <nuxt-link
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
        </b-form>
      </div>
    </no-ssr>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import moment from "moment"
export default {
  name: "Handle",
  display: "Handle",
  instruction: "Drag using the handle icon",
  order: 5,
  components: {draggable}
  ,
    data: () => ({
    taskKey: null,
    editor: "Guest",
    submited: false,
    valid: null,
    dragging: false,
    titleName: "",
    tasks: [{sSubject: "", sDescription: ""},{sSubject: "", sDescription: ""},{sSubject: "", sDescription: ""}]
    //input 3 box.
  }),
  computed: {
    draggingInfo() {
      return this.dragging
    }
  },
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
    onSubmit() {
      let array = []
      let set = new Set()
      let sameIndex = []
      let sameSet = new Set()
      
      for (let i=0;i<this.tasks.length;i++){
        this.tasks[i].valid = null
        if (this.tasks[i].sSubject.trim() == "" && this.tasks[i].sDescription.trim() != ""){
          this.tasks[i].valid = false
          this.$forceUpdate()
        }
          if (this.tasks[i].sSubject.trim() != ""){
            this.tasks[i].valid = null
            array.push(this.tasks[i].sSubject.trim())
              if(sameSet.has(this.tasks[i].sSubject.trim())){
                sameIndex.push(array.length-1)
              }
              else if(set.has(this.tasks[i].sSubject.trim())){
                sameIndex.push(array.indexOf(this.tasks[i].sSubject.trim()))
                sameIndex.push(array.length-1)
                sameSet.add(this.tasks[i].sSubject.trim())
              }else{
                set.add(this.tasks[i].sSubject.trim())
              }
          }else if(this.tasks[i].sSubject==""&&this.tasks[i].sDescription== ""){
            this.tasks[i].valid = false
          }
      }

      if (sameIndex.length>0) {
        for (let i=0;i<sameIndex.length;i++){
          sameIndex[i]
          this.tasks[sameIndex[i]].valid = false
        }
        this.$forceUpdate()
        this.$toast.error("list is same.")
      }
      else {
        this.toSentSubmit()
      }
    },
    addNewlist() {
      this.tasks.push({sSubject: "", sDescription: ""})
    },
    delNewlist(i) {
      this.tasks.splice(i, 1)
    },
    toSentSubmit(){
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
          for (const e of this.tasks) {
          e.valid = true
        }
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
          for (const e of this.tasks) {
          e.valid = true
        }
          vm.$toast.success("This CheckList is Updated!")
          vm.$router.push("/")
        } else {
          vm.$toast.error(data.error == "Don't spacing in text box !" || "This Title is use already!" ? data.error : 'Error API')
        }
        this.submited = false
      }).catch(ex => {
        vm.$toast.error(ex.message)
        this.submited = false
      })
      }
    }
  }
}
</script>

<style>
small.time{
  padding-left: 48px;
}
button[type="submit"] {
  min-width: 120px;
}
.survey-submit {
  position: fixed;
  padding: 20px;
  width: 100vw;
  bottom: 0px;
  left: 0px;
  min-height: 50px;
  background-color: #f8f9fa;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}
.handle {
  float: left;
  padding-top: 8px;
  padding-bottom: 8px;
  margin-right: 50px;
  cursor: grab;
}
.close {
  float: right;
  padding-top: 8px;
  padding-bottom: 8px;
}
input {
  display: inline-block;
}
.closebox{
  margin-left: 30px;
}
</style>