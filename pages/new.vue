<template>
  <div class="container pt-5 pb-3">
    <no-ssr>
        <b-form @submit.prevent="onSubmit">
            <b-row class="justify-content-sm-center">
              <b-col sm="auto">
                <h3 class="title-text">Title :</h3>
              </b-col>
              <b-col sm="28">
                <b-form-input
                  v-model="titleName"
                  placeholder="Title Name"
                  maxlength="50"
                  required
                  tabindex="1"
                  autofocus
                />
              </b-col>
            </b-row>
            <b-row>
              <small v-if="taskKey" class="time"><b>created : </b>{{ getThisDateTime(dCreated) }}
              <b>modified : </b>{{ getThisDateTime(dModified) }}</small>
            </b-row>
            <draggable tag="ul" :list="tasks" handle=".handle" class="list-group">
              <li v-for="(e, i) in tasks" :key="i" class="list-group-item">
                  <b-row>
                    <b-col sm>
                      <i v-if="tasks.length > 1" class="handle" size="sm">
                        <fa icon="grip-vertical" /><br>
                        <fa icon="grip-vertical" /><br>
                        <fa icon="grip-vertical" /><br>
                        <fa icon="grip-vertical" />
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
                        placeholder="List Name"
                        maxlength="50"
                        tabindex="2+`${(i+1)}.`"
                      />
                      <b-form-textarea
                        v-model="e.sDescription"
                        class="form-control"
                        size="sm"
                        placeholder="List Description"
                        maxlength="500"
                        tabindex="2+`${(i+1)}.`"
                        rows="2"
                      />
                    </b-col>
                    <b-col sm>
                      <i v-if="tasks.length > 1" class="closebox" @click="delNewlist(i)">
                        <fa icon="times" />
                      </i>
                    </b-col>
                  </b-row>
              </li>
            </draggable>
            <br><br><br>
          <div class="survey-submit">
            <div class="container">
              <div class="row">
                <div class="col-md-18">
                  <b-button
                    type="button"
                    size="sm"
                    :variant="'outline-info'"
                    tabindex="3"
                    @click="addNewlist"
                    v-text="'Add new list +'"
                  />
                  <span v-text="`Now, ${getList} list(s).`"/>
               </div>
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
  components: {draggable},
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
    },
    getList() {
      return parseInt(this.tasks.length)
    },
  },
  async asyncData({ redirect, params, $axios }) {
    if (params.id) {
      let sKey = parseInt(params.id)
      
      if (sKey == NaN) return redirect("/history")
      let { data } = await $axios("/api/history/new/" + params.id)
      return { titleName: data.titleName, tasks: data.tasks, taskKey: params.id, editor: data.editor, dCreated: data.dCreated, dModified: data.dModified }
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
  line-height : 5px;
  cursor: grab;
}
.handle:active {
    cursor: grabbing !important;
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
  cursor: pointer;
  margin-left: 120px;
}
.no-title{
  line-height: 35px;
}
.title-text{
  padding-left: 30px;
}
</style>