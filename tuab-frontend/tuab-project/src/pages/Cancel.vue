<template lang="">
  <div class="container">
    <body>
      <div class="menubar">
        <div class="namebar" :style="namebarStyle">
            <h3>{{roleName}}: {{name}}
              <img v-if="roleName === 'Super Staff'" src="/crown.png" width="20x" height="20px"> 
              <img v-if="roleName === 'Super Staff'" src="/crown.png" width="20x" height="20px"> 
              <img v-else-if="roleName === 'Staff'" src="/crown.png" width="20x" height="20px"> 
            </h3>
        </div>
        <br><br>
        <p Align=center><button class="backbtn" @click="backhome"><span> BACK </span></button></p><br>
      </div>

      <div class="content">
        <br><br><br>
        <h1>Cancel Booking</h1><br><br>
        <!-- <div class="slot">
          <h2>DD/MM/YYYY</h2><s1>Lane 1</s1><s1>17.00</s1><button class="cancelbtn" @click="openPopup"> CANCEL </button><br>
        </div> -->
        <div v-for="(booking, index) in bookings" :key="index" class="slot">
          <h2>{{ booking.bookingDate }}</h2>
          <s1>Lane {{ booking.targetLaneID }}</s1>
          <s1>{{ booking.shiftID }}</s1>
          <button class="cancelbtn" @click="cancelBooking(booking)">CANCEL</button>
        </div>
        <br><br>
      </div>
    
      <div class="popup" id="popup">
        <a class="close" @click="closePopup">X</a>
        <img src="warning.png" width=40% height=40%><br>
        <h7>Cancel your booking?</h7><br>
        <h8>Please click SUBMIT below, to cancelling your booking</h8><br>
        <button type="submit" @click="submitCancellation"> SUBMIT </button>
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
      roleName: '',
      name: '',
      bookings: [],
    };
  },
  methods: {
    fetchBookings() {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      axios.get('http://localhost:3000/bookingHistory', {
        params: {
          username: this.username
        }
      })
      .then(response => {
        const filteredBookings = response.data.filter(booking => {
          const bookingDate = new Date(booking.bookingDate);
          const bookingStatusID = booking.bookingStatusID;
          const isNotCancelledOrRejected = bookingStatusID !== 3;
          const isWithinDateRange = bookingDate >= new Date(today) && bookingDate <= new Date(tomorrow);

          return isNotCancelledOrRejected && isWithinDateRange;
        });
        this.bookings = filteredBookings;
      })
      .catch(error => {
        console.error('Error fetching bookings:', error);
      });
    },
    cancelBooking(booking) {
      this.openPopup();
      if (this.submitCancellation) {
        this.date = booking.bookingDate,
        this.status = 3
        localStorage.setItem("date", this.date)
        localStorage.setItem("status", this.status)
      }
    },
    submitCancellation() {
      this.date = localStorage.getItem("date");
      this.status = localStorage.getItem("status");
      axios.post('http://localhost:3000/cancelBooking', {
        date: this.date,
        status: this.status,
        username: this.username
      })
      .then(response => {
        console.log('Booking canceled successfully:', response.data);
        this.closePopup();
        localStorage.removeItem("date");
        localStorage.removeItem("status");
      })
      .catch(error => {
        console.error('Error canceling booking:', error);
        this.fetchBookings();
      });
    },
    backhome () {
      if(this.roles == '1'){
        this.$router.push('/general-home')
        localStorage.removeItem("date");
        localStorage.removeItem("status");
      }
      else if(this.roles == '2'){
        this.$router.push('/superStaff-home')
        localStorage.removeItem("date");
        localStorage.removeItem("status");
      }
      else if(this.roles == '3'){
        this.$router.push('/staff-home')
        localStorage.removeItem("date");
        localStorage.removeItem("status");
      }
    },    
    openPopup(){
      popup.classList.add('open-popup')
    },
    closePopup(){
      popup.classList.remove('open-popup')
    }
  },
  computed: {
    namebarStyle() {
      if (this.roleName === "Super Staff" || this.roleName === "Staff") {
        return { backgroundColor: '#90f2e3' };
      } else {
        return { backgroundColor: '#F9D871'};
      }
    }
  },
  mixins: [NotToken],
  mounted() {
    this.username = localStorage.getItem("username");
    this.fetchBookings();
  },
}  
</script>

<style scoped>
@import '@/assets/css/Cancel.css';
</style>