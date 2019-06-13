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
                <b-form-input v-model="Titlename" placeholder="Enter your Title" />
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
            <div v-for="(item, i) in list" :key="i" class="col-sm-36">
              <b-container fluid>
                <span class="float-right" style="cursor:pointer" @click="delNewlist">X</span>
                <div class="list-form">
                  <b-row>
                    <b-col sm="3">
                      <label class="card-title">{{ (i+1) }}.</label>
                    </b-col>
                    <b-col sm="9">
                      <b-form-input
                        v-model="item.id"
                        type="text"
                        class="sublist-form"
                        placeholder="Enter your List"
                      />
                    </b-col>
                  </b-row>
                </div>
              </b-container>
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
                      v-text="submited ? 'Approving...' : taskKey = 'Submit'"
                    />
                    <nuxt-link
                      tag="button"
                      to="/"
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
import moment from "moment";
export default {
  data: () => ({
    taskKey: null,
    submited: false,
    current: moment(),
    list: [{id: ""}]
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
  },
  methods: {
    onSubmit() {
      let vm = this;
      this.submited = true;
      vm.$axios
        .post("/api/history/new", {
          
        })
        .then(({ data }) => {
          if (data.success) {
            if (!this.taskKey) {
              vm.$toast.success("Thanks.");
              vm.onReset();
            } else {
              vm.$toast.success("Task Updated.");
              vm.$router.push("/");
            }
          } else {
            vm.$toast.error("Error API");
          }
          this.submited = false;
        })
        .catch(ex => {
          vm.$toast.error(ex.message);
          this.submited = false;
          console.log(TitleName)
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