<template lang="">
  <div class="container">
    <body>
      <div class="menubar">
        <div class="namebar">
          <h3>{{roleName}}: {{name}}
            <img v-if="roleName === 'Super Staff'" src="/crown.png" width="20x" height="20px"> 
            <img v-if="roleName === 'Super Staff'" src="/crown.png" width="20x" height="20px"> 
          </h3>
        </div>
        <br><br>
        <p Align=center><button class="menu" @click="booking"><span> BOOK NOW </span></button></p><br>
        <p Align=center><button class="menu" @click="cancel"><span> CANCEL BOOKING </span></button></p><br>
        <p Align=center><button class="menu" @click="history"><span> BOOKING HISTORY </span></button></p><br>
        <p Align=center><button class="menu" @click="StaffTimesheet"><span><img src="setting.png" width=9%> Staff Timesheet </span></button></p><br>
        <p Align=center><button class="staffmenu" @click="shiftSchedule"><span><img src="setting.png" width=9%> Manage Timesheet </span></button></p><br>
        <p Align=center><button class="staffmenu" @click="operation"><span><img src="setting.png" width=9%> Edit Settings </span></button></p><br>

        <br><br>
        <p Align=center><LogoutBotton /></p>
      </div>

      <div class="content">
        <div class="content-wrapper">
          <h1>Welcome to TU Archery Booking system</h1>
          <h4>You're in Super Staff mode. Please select a date on the calendar to view and manage bookings.</h4>

          <!-- ใช้ FullCalendar ด้วยโหมด superstaff -->
          <div class="calendar-container">
            <StaffCalendar mode="superstaff" @date-selected="handleCalendarDateSelect" />
          </div>
        </div>
      </div>

      <!-- Booking Management PopUp -->
      <div class="booking-popup" v-if="showBookingPopup">
        <div class="booking-popup-content">
          <div class="booking-popup-header">
            <h2>Bookings for: {{ formatDisplayDate(selectedDate) }}</h2>
            <span class="close-btn" @click="closeBookingPopup">&times;</span>
          </div>
          <div class="booking-popup-body">
            <div v-if="bookings.length === 0" class="no-bookings">
              <p>No bookings for this date.</p>
            </div>
            
            <div v-else>
              <!-- Bookings Slot -->
              <div v-for="(booking, index) in bookings" :key="index" class="slot">
                <template v-if="booking.bookingStatusID !== 3">
                  <h2>{{ booking.username }}</h2>
                  <n>{{ booking.name }}</n>
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
          </div>
        </div>
      </div>

      <!-- Payment Slip PopUp -->
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
import StaffCalendar from './StaffCalendar.vue';

export default {
  components:{
    LogoutBotton,
    StaffCalendar
  },
  data() {
    return {
      roleName: '',
      name: '',
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
      selectedStatus: [],
      showBookingPopup: false // เพิ่มตัวแปรควบคุมการแสดง popup
    };
  },
  mixins: [NotToken],
  methods: {
    // รับค่าวันที่จากปฏิทินเมื่อมีการคลิก
    handleCalendarDateSelect(formattedDate) {
      console.log("Received date from calendar:", formattedDate);
      this.selectedDate = formattedDate;
      this.fetchBookings(); // เรียกฟังก์ชันเพื่อดึงข้อมูลการจองสำหรับวันที่เลือก
    },
    
    // แสดงวันที่ในรูปแบบที่อ่านง่าย
    formatDisplayDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    },
    
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
    StaffTimesheet() {
      this.$router.replace("staff-timesheet");
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
    
    // ปิด popup การจัดการการจอง
    closeBookingPopup() {
      this.showBookingPopup = false;
    },
    
    // ดึงข้อมูลการจองและแสดง popup
    fetchBookings() {
      axios.get('http://localhost:3000/checkBookStaff', { params: { date: this.selectedDate } })
      .then(response => {
        this.bookings = response.data;
        
        // กำหนดค่าเริ่มต้นอาร์เรย์ selectedStatus ด้วยสถานะการจองปัจจุบัน
        this.selectedStatus = this.bookings.map(booking => booking.bookingStatusID);
        
        // แสดง popup หลังจากดึงข้อมูลเสร็จ
        this.showBookingPopup = true;
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
      // ตรวจสอบว่ามีการจองที่ใช้งานอยู่ (ไม่ได้ยกเลิก) ใดๆ ที่ขาดสถานะหรือไม่
      const activeBookings = this.bookings.filter(booking => booking.bookingStatusID !== 3);
      const activeIndices = activeBookings.map(booking => 
        this.bookings.findIndex(b => b.bookingID === booking.bookingID)
      );
      
      const hasNullStatus = activeIndices.some(index => 
        this.selectedStatus[index] === null || this.selectedStatus[index] === undefined
      );
      
      if (hasNullStatus) {
        alert('กรุณาเลือกสถานะสำหรับการจองที่ใช้งานอยู่ทั้งหมด');
        return;
      }
      
      let updateCount = 0;
      const totalUpdates = activeBookings.length;
      
      // อัพเดตเฉพาะการจองที่ใช้งานอยู่
      activeBookings.forEach(booking => {
        const index = this.bookings.findIndex(b => b.bookingID === booking.bookingID);
        const selectedStatus = this.selectedStatus[index];
        const { bookingID } = booking;
        
        axios.post('http://localhost:3000/staffApprove', { bookId: bookingID, status: selectedStatus })
        .then(response => {
          console.log(`อัพเดตสถานะสำหรับการจอง ID ${bookingID}: ${response.data.message}`);
          updateCount++;
          
          if (updateCount === totalUpdates) {
            // เมื่ออัพเดททุกรายการเสร็จแล้ว
            alert('อัพเดตทุกการจองเรียบร้อยแล้ว!');
            this.closeBookingPopup();
          }
        })
        .catch(error => {
          console.error(`เกิดข้อผิดพลาดในการอัพเดตสถานะสำหรับการจอง ID ${bookingID}:`, error);
        });
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
@import '@/assets/css/Calendar.css';

/* เพิ่มการปรับแต่งสำหรับแก้ปัญหาปฏิทินถูกแถบบังส่วนบนล่าง */
.content-wrapper {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.content h1, .content h4 {
  padding-left: 0;
  text-align: center;
  margin-bottom: 10px;
}

.calendar-container {
  width: 100%;
  height: auto;
  overflow: visible;
  margin: 20px 0;
  padding-bottom: 50px; /* เพิ่มพื้นที่ด้านล่าง */
}

/* แก้ไข CSS ปฏิทินให้แสดงผลเต็มพื้นที่ที่มี */
:deep(.calendar-container) {
  max-height: none;
  overflow: visible;
}

:deep(.calendar-grid) {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

/* สไตล์สำหรับ popup การจัดการการจอง */
.booking-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* พื้นหลังสีเข้มโปร่งใส */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.booking-popup-content {
  background-color: white;
  border-radius: 8px;
  width: 80%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.booking-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f5f5;
  padding: 15px 20px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: 1px solid #ddd;
}

.booking-popup-header h2 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #000;
}

.booking-popup-body {
  padding: 20px;
}

.no-bookings {
  text-align: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 5px;
  margin: 10px 0;
}

/* ปรับแต่งสไตล์ slot ให้เหมาะกับ popup */
.slot {
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}
</style>