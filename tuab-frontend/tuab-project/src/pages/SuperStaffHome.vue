<template lang="">
  <div class="container">
    <body>
      <div class="menubar">
        <div class="namebar">
          <h3>{{roleName}}: {{name}}</h3>
        </div>
        <br><br>
        <p Align=center><LogoutBotton /></p>
        <br><br>
        <p Align=center><button class="menu" @click="booking"><span> BOOK NOW </span></button></p><br>
        <p Align=center><button class="menu" @click="cancel"><span> CANCEL BOOKING </span></button></p><br>
        <p Align=center><button class="menu" @click="history"><span> BOOKING HISTORY </span></button></p><br>
        <p Align=center><button class="staffmenu" @click="shiftSchedule"><span><img src="setting.png" width=9%> Manage Timesheet </span></button></p><br>
        <p Align=center><button class="staffmenu" @click="operation"><span><img src="setting.png" width=9%> Edit Settings </span></button></p><br>
      </div>

      <div class="content">
        <br><br><br>
        <h1>Welcome to TU Archery Booking system</h1><br>
        <h4>You're logging-in in Super Staff mode, Please select date to approve the bookings</h4><br>
        <form @submit.prevent="submitForm">
          <p Align="center">
            <input class="datepicker" type="date" v-model="selectedDate" :min="minDate" :max="maxDate">
            <button class="select" type="submit">Select</button>
          </p>
        </form>
        <br><br>

        <!-- Bookings Slot -->
        <div v-for="(booking, index) in bookings" :key="index" class="slot">
          <template v-if="booking.bookingStatusID !== 3">
            <h2>{{ booking.username }}</h2>
            <name>{{ booking.name }}</name>
            <t1>(Tel.{{booking.telNumber}})</t1>
            <h5>{{ booking.shiftID }}</h5>
            <h5>Lane {{ booking.targetLaneID }}</h5>
            <button class="slipbtn" @click="showSlip(booking)">Payment</button>
            <select v-model="selectedStatus[index]" class="status-select" id="status">
              <option v-if="!selectedStatus[index]" :value="null" disabled selected>Please select one:</option>
              <option v-for="status in status" :key="status.id" :value="status.id">{{ status.name }}</option>
            </select>
            <br>
          </template>
        </div>
        <center><button class="submit" type="submit" @click="updateStatus">UPDATE</button></center>
      </div>

      <!-- Slip PopUp -->
      <div class="popup" id="popup">
        <a class="close" @click="closePopup">X</a>
        <br><br>
        <p1>Payment Detail</p1>
        <br><br>
        <p2>Bank:  {{ bankName }}</p2><br>
        <p2>Last 4 digits of account no.: {{ accountDigit }}</p2><br>
        <p2>Proceed date and time: {{ dateATime }}</p2>
      </div>
    </body>
  </div>
</template>

<script>
import axios from 'axios';
import NotToken from '../components/NotToken.vue';
import LogoutBotton from '../components/LogoutBotton.vue';
export default {
  components:{
    LogoutBotton
  },
  data() {
    return {
      roleName: '',
      name: '',
      date: '2018-03-02', // YYYY-MM-DD
      selectedLane: '',
      selectedDate: '', // Selected date
      minDate: '',      // Minimum date
      maxDate: '',       // Maximum date
      status: [
        {id: 1, name: 'Pending'},
        {id: 2, name: 'Confirm'},
        {id: 3, name: 'Cancel'},
      ],
      bookings: [],
      tel: '',
      bankName: '',
      accountDigit: '',
      dateATime: '',
      selectedStatus: []
    };
  },
  mixins: [NotToken],
  methods: {
    booking() {
      this.$router.replace("booking");
    },
    history() {
      this.$router.replace("history");
    },
    cancel() {
      this.$router.replace("cancel");
    },
    operation() {
      this.$router.replace("operation");
    },
    shiftSchedule() {
      this.$router.replace("shift-schedule");
    },
    showSlip(booking) {
      const { username, bookingID } = booking;

      axios.get('http://localhost:3000/checkSlip', { params: { username, bookId: bookingID } })
      .then(response => {
        this.bankName = response.data[0].bankName
        this.accountDigit = response.data[0].accountDigit
        this.dateATime = response.data[0].dateATime
        this.openPopup()
      })
      .catch(error => {
        console.error('Error fetching payment details:', error);
      });
    },
    openPopup(){
      popup.classList.add('open-popup')
    },
    closePopup(){
      popup.classList.remove('open-popup')
    },
    submitForm() {
      axios.get('http://localhost:3000/checkBookStaff', { params: { date: this.selectedDate } })
      .then(response => {
        this.bookings = response.data;
        this.selectedStatus = new Array(this.bookings.length).fill(null);
        this.bookings.forEach((booking, index) => {
          if (booking.bookingStatusID === 2) {
            this.selectedStatus[index] = 2;
          }
        });
      })
      .catch(error => {
        console.error('Error fetching bookings:', error);
      });
    },
    fetchOperation() {
      axios.get('http://localhost:3000/checkoperation')
      .then(response => {
        if (response.data && response.data.length > 0) {
          const operationDay = response.data[0];
          const endDate = operationDay.endDate;
          localStorage.setItem("endDate", endDate);
        } else {
          console.error('No data received or invalid response format.');
        }
      })
      .catch(error => {
        console.error('Error fetching bookings:', error);
      });
    },
    updateStatus() {
      if (this.selectedStatus.some(status => status === null)) {
        alert('Please select a status for each booking');
        return;
      }
      this.bookings.forEach((booking, index) => {
        if (booking.bookingStatusID !== 3) {
          const selectedStatus = this.selectedStatus[index];
          const { bookingID } = booking;
          axios.post('http://localhost:3000/staffApprove', { bookId: bookingID, status: selectedStatus })
          .then(response => {
            console.log(`Status updated for bookingID ${bookingID}: ${response.data.message}`);
          })
          .catch(error => {
            console.error(`Error updating status for bookingID ${bookingID}:`, error);
          });
        }
      });
    }
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
  }
}
</script>

<style scoped>
@import '@/assets/css/SuperStaffHome.css';
</style>