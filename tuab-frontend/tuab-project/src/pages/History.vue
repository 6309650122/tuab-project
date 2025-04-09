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
          <h2>{{ formatDate(booking.bookingDate) }}</h2>
          <s1>Lane {{ booking.targetLaneID }}</s1>
          <s1>{{ booking.shiftID }}</s1>
          
          <!-- แสดงเวลาที่ยกเลิกถ้าสถานะเป็น "ยกเลิก" -->
          <s1 v-if="booking.bookingStatusID === 3 && booking.cancelTime" class="cancel-time">
            ยกเลิกเมื่อ: {{ booking.cancelTime }}
          </s1>
          
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
    
    // Log ข้อมูลดิบเพื่อตรวจสอบ
    axios.get('http://localhost:3000/filterBookMonth', {params: {username: this.username}})
      .then(response => {
        console.log('Raw booking data sample:', response.data[0]);
      });
  },
  computed: {
    namebarStyle() {
      if (this.roleName === "Super Staff") {
        return { backgroundColor: '#90f2e3' };
      } else if (this.roleName === "Staff") {
        return { backgroundColor: '#90f2e3' };
      } else {
        return { backgroundColor: '#F9D871' };
      }
    }
  },
  methods: {
    // ฟังก์ชันจัดรูปแบบวันที่
    formatDate(dateString) {
      if (!dateString) return '';
      
      // ตรวจสอบรูปแบบวันที่ก่อน
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          // ถ้าเป็นรูปแบบ YYYY-MM-DD
          if (parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
          // ถ้าเป็นรูปแบบ DD-MM-YYYY
          else if (parts[2].length === 4) {
            return `${parts[0]}/${parts[1]}/${parts[2]}`;
          }
        }
      }
      
      // กรณีอื่นๆ แปลงเป็น Date object และจัดรูปแบบ
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString; // ถ้าแปลงไม่ได้ ส่งค่าเดิมกลับไป
        }
        
        // จัดรูปแบบวันที่เป็น DD/MM/YYYY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
      } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
      }
    },
    
    fetchBookings() {
      axios.get('http://localhost:3000/filterBookMonth', {params: {username: this.username}})
      .then(response => {
        const bookings = response.data;
        // เรียงตามวันที่และ Lane ID
        bookings.sort((a, b) => {
          // เรียงตามวันที่ (ล่าสุดขึ้นก่อน)
          const dateA = new Date(this.parseDateString(a.bookingDate));
          const dateB = new Date(this.parseDateString(b.bookingDate));
          
          if (dateA > dateB) return -1;
          if (dateA < dateB) return 1;
          
          // ถ้าวันที่เท่ากัน เรียงตาม Lane ID
          return a.targetLaneID - b.targetLaneID;
        });
        
        this.bookings = bookings;
      })
      .catch(error => {
        console.error('Error fetching bookings:', error);
      });
    },
    
    // Helper function สำหรับแปลงรูปแบบวันที่ DD/MM/YYYY หรือ DD-MM-YYYY เป็น YYYY-MM-DD
    parseDateString(dateStr) {
      if (!dateStr) return new Date();
      
      try {
        // รองรับรูปแบบ DD/MM/YYYY หรือ DD-MM-YYYY
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        } else if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            // ถ้าเป็นรูปแบบ DD-MM-YYYY
            if (parts[2].length === 4) {
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            // ถ้าเป็นรูปแบบ YYYY-MM-DD (เป็นรูปแบบที่ถูกต้องสำหรับ Date แล้ว)
            else if (parts[0].length === 4) {
              return dateStr;
            }
          }
        }
        
        // ถ้าไม่ตรงกับรูปแบบใดๆ ส่งคืนค่าเดิม
        return dateStr;
      } catch (error) {
        console.error('Error parsing date string:', error);
        return dateStr;
      }
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

/* เพิ่ม CSS สำหรับแสดงเวลาที่ยกเลิก */
.cancel-time {
  color: #ff5252;
  font-size: 0.85em;
  display: block;
  margin-top: 5px;
  background-color: rgba(255, 82, 82, 0.1);
  padding: 3px 6px;
  border-radius: 4px;
  border-left: 3px solid #ff5252;
  width: fit-content;
}
</style>