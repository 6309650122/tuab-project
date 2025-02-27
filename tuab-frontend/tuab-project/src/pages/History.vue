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
        <h1>Booking History</h1> 
        <br>
        <div class="status-container">     
            <img src="bstatus.png" class="sticky-img" width=39% height=15%>
        </div>

        <div class="content2">
        <br><br>
        <div v-for="(booking, index) in bookings" :key="index" class="slot">
          <h2>{{ booking.bookingDate }}</h2>
          <s1>Lane {{ booking.targetLaneID }}</s1>
          <s1>{{ booking.shiftID }}</s1>
          <!-- <button class="addbtn" @click="addslip(booking.bookingID)"><span>PAYMENT</span></button> -->
          <button class="addbtn" 
              :class="{ 'disabled-btn': booking.bookingStatusID === 2 || booking.bookingStatusID === 3 }"  
              @click="addslip(booking.bookingID)" 
              :disabled="booking.bookingStatusID === 2 || booking.bookingStatusID === 3">
            <span>PAYMENT</span>
          </button>


          <img v-if="booking.bookingStatusID === 2" src="paychecked.png" width="4%" height="4%">
          <img v-else-if="booking.bookingStatusID === 1" src="paypending.png" width="4%" height="4%">
          <img v-else-if="booking.bookingStatusID === 3" src="cancel.png" width="4%" height="4%">
        </div>
        <br><br>
      </div>
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
      bookings: []
    };
  },
  mixins: [NotToken],
  mounted() {
    this.username = localStorage.getItem("username");
    this.fetchBookings();
  },
  computed: {
    namebarStyle() {
      if (this.roleName === "Super Staff") {
        return { backgroundColor: '#90f2e3' };
      } else if (this.roleName === "Staff") {
        return { backgroundColor: '#90f2e3' };
      } 
    }
  },
  methods: {
    fetchBookings() {
      axios.get('http://localhost:3000/filterBookMonth', {params: {username: this.username}})
      .then(response => {
        const bookings = response.data;
        bookings.sort((a, b) => b.bookingID - a.bookingID);
        this.bookings = bookings;
      })
      .catch(error => {
        console.error('Error fetching bookings:', error);
      });
    },
    backhome () {
      if(this.roles == '1'){
        this.$router.push('/general-home')
      }
      else if(this.roles == '2'){
        this.$router.push('/superStaff-home')
      }
      else if(this.roles == '3'){
        this.$router.push('/staff-home')
      }
    },
    addslip (bookingID) {
      this.$router.push({
        path: '/add-payment',
        query: { bookingID: bookingID }
      });
    },
  },
}  
</script>

<style scoped>
@import '@/assets/css/History.css';
</style>
