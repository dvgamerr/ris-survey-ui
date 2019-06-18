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
                <b-form-input
                  v-model="titleName"
                  placeholder="Enter your Title"
                  maxlength="50"
                  required
                  tabindex="2"
                  autofocus
                />
              </b-col>
              <b-button
                type="button"
                size="ssm"
                :variant="'outline-info'"
                @click="addNewlist"
                v-text="'Add new list +'"
              />
            </b-row>
            <hr>
          </div>
          <div class="row mb-5 pb-5">
            <div v-for="(e, i) in tasks" :key="i" class="col-sm-36">
              <b-container fluid>
                <div class="list-form">
                  <b-row class="justify-content-md-center">
                    <b-col sm="1">
                      <label class="card-title">{{ (i+1) }}.</label>
                    </b-col>
                    <b-col sm="15">
                      <b-form-input
                        v-model="e.sSubject"
                        type="text"
                        class="sublist-form"
                        size="sm"
                        placeholder="Enter your List"
                        maxlength="50"
                        tabindex="2"
                        required
                      />
                    </b-col>
                    <b-col sm="1">
                      <b-button v-if="i>0" size="sm" variant="danger" @click="delNewlist">X</b-button>
                    </b-col>
                  </b-row>
                </div>
              </b-container>
            </div>
            <div class="survey-submit">
              <div class="container">
                <div class="row">
                  <div class="col-md-18"/>
                  <div class="col-md-18 text-right">
                    <b-button
                      type="submit"
                      :disabled="submited"
                      variant="primary"
                      v-text="submited ? 'Approving...' : taskKey = 'Submit'"
                    />
                    <nuxt-link tag="button" to="/" type="button" class="btn btn-secondary">Back</nuxt-link>
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
    titleName: "",
    tasks: [{ sSubject: "" }]
  }),
  computed: {
    getTaskDateTime() {
      return moment(this.taskKey, "YYYYMMDDHHmmssSSS").format(
        "DD MMMM YYYY HH:mm:ss"
      );
    },
    getDateTime() {
      return this.current.format("DD MMMM YYYY HH:mm:ss");
    }
  },
  methods: {
    onSubmit() {
      let vm = this;
      let data = vm.tasks.map(e => {
        return {
          sSubject: e.sSubject
        };
      });
      this.submited = true;
      vm.$axios
        .post("/api/history/new", {
          key: vm.taskKey,
          tasks: vm.tasks,
          titleName: vm.titleName
        })
        .then(({ data }) => {
          if (data.success) {
            vm.$toast.success("List Updated.");
            vm.$router.push("/");
          } else {
            vm.$toast.error("Error API // This Title is use already!");
          }
          this.submited = false;
        })
        .catch(ex => {
          vm.$toast.error(ex.message);
          this.submited = false;
        });
    },
    addNewlist() {
      this.tasks.push({
        id: ""
      });
    },
    delNewlist(i) {
      this.tasks.splice(i, 1);
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