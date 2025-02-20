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
          <input class="datepicker" 
                type="date" 
                v-model="startDate" 
                :min="minDate" 
                :disabled="isDateDisabled(startDate)"   
          required>
          </center>
          <br><br>

          <!-- End Date -->
          <label>End Date</label><br>
          <center>
          <input class="datepicker" 
                type="date" 
                v-model="endDate" 
                :min="nextDayStartDate" 
                :disabled="isDateDisabled(endDate)"  
          required>
          <center><button class="submit" @click="submitForm">SAVE</button></center>
          </center>
        </form>
      </div>

      <div class="content">
        <h4>Current Super Staff : {{username}} {{name}}</h4> 
      </div>

      <!-- CompletePopUP  -->
      <div class="popup" id="completePopup">
        <img src="paychecked.png" width=30% height=30%><br>
        <h7>The operation has been saved</h7><br>
        <button type="submit" @click="closePopup">DONE</button>
      </div> 
      <!-- CompletePopUP For Alert -->
      <div class="popup" id="completePopupForAlert">
        <img src="warning.png" width=30% height=30%><br>
        <h7>Please select the different between start date and end date</h7><br>
        <button type="submit" @click="closePopupForAlert">CLOSE</button>
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
      holidays: [],
    };
  },
  methods: {
    async fetchHolidays() {
    try {
      const response = await axios.get('http://localhost:3000/thaiHolidays');
      this.holidays = response.data.holidays
        .filter(holiday => holiday.public)  // กรองเฉพาะวันหยุดที่ public: true
        .map(holiday => holiday.date);      // เก็บแค่วันที่

      console.log(this.holidays);  // ตรวจสอบข้อมูลที่ดึงมา
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  },

  isDateDisabled(date) {
    const day = new Date(date).getDay();
    
    // วันเสาร์ (6) หรือวันอาทิตย์ (0)
    const isWeekend = (day === 0 || day === 6);

    // วันหยุดนักขัตฤกษ์
    const isHoliday = this.holidays.includes(date);
    
    // ไม่สามารถเลือกวันเสาร์, อาทิตย์ หรือวันหยุด
    return isWeekend || isHoliday;
  }, 
    
  backhome() {
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
      if (this.startDate && this.endDate && this.startDate === this.endDate){
        this.openPopupForAlert();
        return;
      }

      if (this.startDate && this.endDate && !this.isSubmitting && this.startDate !== this.endDate) {
        this.isSubmitting = true;
        const formData = {
          opID: localStorage.getItem("opID"),
          Nstart: this.startDate,
          Nend: this.endDate
        };

        console.log('Sending form data:', formData); 

        axios.post('http://localhost:3000/editoperation', formData)
        .then((response) => {
          console.log('Response from server:', response);
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
    },
    openPopupForAlert(){
      const completePopup = document.getElementById('completePopupForAlert');
      completePopup.classList.add('open-popup')
    },
    closePopupForAlert(){
      const completePopup = document.getElementById('completePopupForAlert');
      completePopup.classList.remove('open-popup')
    },
    disableWeekends (date) {
      const day = new Date(date).getDay()
      return day === 0 || day === 6
    },
  },
  mounted() {
    // Get today's date
    const today = new Date();

    // Set the minimum date to today
    this.minDate = today.toISOString().split('T')[0];

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // Set the maximum date to tomorrow
    this.maxDate = tomorrow.toISOString().split('T')[0];

    this.fetchOperation();
    this.fetchHolidays();

    console.log(this.holidays)
  },
  computed: {
  nextDayStartDate() {
    if (this.startDate) {
      const date = new Date(this.startDate);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0];
    } 
    return null; // หากยังไม่มี startDate
  }
},
  mixins: [NotToken],
}
</script>

<style scoped>
@import '@/assets/css/Operation.css';
.disabled {
  color: #ccc; /* ทำให้ตัวอักษรจางลง */
  background-color: #eee; /* ทำให้พื้นหลังเป็นสีเทา */
}
</style>