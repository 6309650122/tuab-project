<template lang="">
  <div class="container">
    <body>
      <div class="menubar">
        <div class="namebar">
            <h4>{{roleName}}: {{name}}</h4>
        </div>
        <br><br>
        <p Align=center><button class="backbtn" @click="backhome"><span> BACK </span></button></p><br>
      </div>

      <div class="content">
        <br><br><br>
        <h1>Edit Settings</h1><br>
        <h2>Please select start and end date to set an opening day</h2><br>

        <form @submit.prevent="submitForm" >
          <!-- Start Date -->
          <label>Start Date</label><br>
          <center>
          <input class="datepicker" type="date" v-model="startDate" :min="minDate" required>
          </center>
          <br><br>

          <!-- End Date -->
          <label>End Date</label><br>
          <center>
          <input class="datepicker" type="date" v-model="endDate" :min="startDate" required>
          <center><button class="submit" @click="submitForm">SAVE</button></center>
          </center>
        </form>
      </div>

      <!-- CompletePopUP  -->
      <div class="popup" id="completePopup">
        <img src="paychecked.png" width=30% height=30%><br>
        <h7>The operation has been saved</h7><br>
        <button type="submit" @click="closePopup">DONE</button>
      </div> 
    </body>
  </div>
</template>

<script>
import NotToken from '../components/NotToken.vue';
import axios from 'axios';
export default {
  data() {
    return {
      isSubmitting: false,
      roleName: '',
      startDate: '',
      endDate:'',
      minDate: '',      // Minimum date
      name: '',
    };
  },
  methods: {
    backhome () {
      this.$router.push('/superStaff-home')
      localStorage.removeItem("opID");
    },
    fetchOperation() {
      axios.get('http://localhost:3000/checkoperation')
      .then(response => {
        if (response.data && response.data.length > 0) {
          const operationDay = response.data[0];
          const operationID = operationDay.operationID;
          localStorage.setItem("opID", operationID);
        } else {
          console.error('No data received or invalid response format.');
        }
      })
      .catch(error => {
        console.error('Error fetching bookings:', error);
      });
    },
    submitForm() {
      if (this.startDate && this.endDate && !this.isSubmitting) {
        this.isSubmitting = true;
        const formData = {
          opID: localStorage.getItem("opID"),
          Nstart: this.startDate,
          Nend: this.endDate
        };
        axios.post('http://localhost:3000/editoperation', formData)
        .then((response) => {
          this.openPopup();
        })
        .catch((error) => {
          console.error('Error inserting operation into database:', error);
        })
        .finally(() => {
          this.isSubmitting = false;
        });
      }
    },
    openPopup(){
      const completePopup = document.getElementById('completePopup');
      completePopup.classList.add('open-popup')
    },
    closePopup(){
      const completePopup = document.getElementById('completePopup');
      completePopup.classList.remove('open-popup')
    }
  },
  mounted() {
    // Get today's date
    const today = new Date();

    // Set the minimum date to today
    this.minDate = today.toISOString().split('T')[0];
    this.fetchOperation();
  },
  mixins: [NotToken],
}
</script>

<style scoped>
@import '@/assets/css/Operation.css';
</style>