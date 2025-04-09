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
        <h5>Cancel your booking?</h5><br>
        <h6>Please click SUBMIT below, to cancelling your booking</h6><br>
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
      username: '',
      roles: '',
      bookings: [],
      bookingToCancel: null
    };
  },
  methods: {
    fetchBookings() {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      axios.get('http://localhost:3000/bookingHistory', {
        params: {
          username: this.username
        }
      })
      .then(response => {
        console.log('Retrieved bookings:', response.data);
        const filteredBookings = response.data.filter(booking => {
          // แปลงวันที่จาก YYYY-MM-DD เป็น Date object
          const parts = booking.bookingDate.split('-');
          const bookingDate = new Date(
            parseInt(parts[0]),  // ปี
            parseInt(parts[1]) - 1,  // เดือน (0-11)
            parseInt(parts[2])   // วัน
          );
          
          const bookingStatusID = parseInt(booking.bookingStatusID);
          console.log(`Booking ID: ${booking.bookingID}, Status: ${bookingStatusID}, Date: ${bookingDate}, Shift: ${booking.shiftID}`);
          
          const isNotCancelledOrRejected = bookingStatusID !== 3;
          const isWithinDateRange = bookingDate >= new Date(today) && bookingDate <= new Date(futureDate);

          return isNotCancelledOrRejected && isWithinDateRange;
        });
        
        console.log('Filtered bookings:', filteredBookings);
        this.bookings = filteredBookings;
      })
      .catch(error => {
        console.error('Error fetching bookings:', error);
      });
    },
    
    // แปลงวันที่จาก YYYY-MM-DD เป็น YYYY-MM-DD
    formatDateForMySQL(dateString) {
      try {
        // ถ้าเป็นรูปแบบ YYYY-MM-DD ที่ถูกต้องแล้ว
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (datePattern.test(dateString)) {
          return dateString;
        }
        
        // ถ้าเป็นรูปแบบ DD-MM-YYYY
        if (dateString.includes('-')) {
          const parts = dateString.split('-');
          if (parts.length === 3) {
            // ตรวจสอบว่าปีมี 4 หลัก
            if (parts[0].length === 4) {
              // เป็นรูปแบบ YYYY-MM-DD อยู่แล้ว
              return dateString;
            } else if (parts[2].length === 4) {
              // เป็นรูปแบบ DD-MM-YYYY
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }
        }
        
        // หากไม่ตรงกับรูปแบบที่รองรับ ให้ลองแปลงเป็น Date object
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
        
        console.error('Invalid date format:', dateString);
        return dateString;
      } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
      }
    },
    
    cancelBooking(booking) {
      this.bookingToCancel = booking;
      console.log('Selected booking for cancellation:', booking);
      this.openPopup();
    },
    
    submitCancellation() {
      if (!this.bookingToCancel) {
        console.error('No booking selected for cancellation');
        this.closePopup();
        return;
      }

      console.log('Cancelling booking:', this.bookingToCancel);
      
      // แปลงรูปแบบวันที่ให้ถูกต้อง
      const formattedDate = this.formatDateForMySQL(this.bookingToCancel.bookingDate);
      console.log('Original date:', this.bookingToCancel.bookingDate);
      console.log('Formatted date for API:', formattedDate);
      
      // แปลง targetLaneID กลับเป็นรูปแบบที่เก็บในฐานข้อมูล (ถ้าใน DB เก็บเป็น 101-106)
      const originalLaneID = parseInt(this.bookingToCancel.targetLaneID) + 100;
      
      // ส่ง shiftID ไปด้วยเพื่อให้ยกเลิกเฉพาะช่วงเวลาที่เลือก
      axios.post('http://localhost:3000/cancelBooking', {
        date: formattedDate,
        status: 3, // สถานะยกเลิก
        username: this.username,
        targetLaneID: originalLaneID,
        shiftID: this.bookingToCancel.shiftID // เพิ่ม shiftID
      })
      .then(response => {
        console.log('Booking canceled successfully:', response.data);
        
        // ลบรายการที่ถูกยกเลิกออกจาก bookings array โดยตรวจสอบทั้ง lane และ shift
        this.bookings = this.bookings.filter(booking => 
          !(booking.bookingDate === this.bookingToCancel.bookingDate && 
            booking.targetLaneID === this.bookingToCancel.targetLaneID &&
            booking.shiftID === this.bookingToCancel.shiftID)
        );
        
        alert('ยกเลิกการจองเรียบร้อยแล้ว');
        
        this.closePopup();
        this.bookingToCancel = null;
        this.fetchBookings(); // ดึงข้อมูลใหม่อีกครั้ง
      })
      .catch(error => {
        console.error('Error canceling booking:', error);
        alert('เกิดข้อผิดพลาดในการยกเลิกการจอง โปรดลองอีกครั้ง');
        console.log('Error details:', error.response ? error.response.data : error.message);
        this.closePopup();
        this.bookingToCancel = null;
      });
    },
    
    backhome() {
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
    openPopup(){
      popup.classList.add('open-popup')
    },
    closePopup(){
      popup.classList.remove('open-popup')
      this.bookingToCancel = null;
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
    this.name = localStorage.getItem("name") || '';
    this.roleName = localStorage.getItem("roleName") || '';
    this.roles = localStorage.getItem("roles") || '';
    this.fetchBookings();
  },
}  
</script>

<style scoped>
@import '@/assets/css/Cancel.css';
</style>