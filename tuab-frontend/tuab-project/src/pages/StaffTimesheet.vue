<template>
    <div class="container">
      <div class="menubar">
        <div class="namebar" :style="namebarStyle">
          <h4>{{ roleName }}: {{ name }}
            <img v-if="roleName === 'Super Staff'" src="/crown.png" width="20x" height="20px"> 
            <img v-if="roleName === 'Super Staff'" src="/crown.png" width="20x" height="20px"> 
            <img v-else-if="roleName === 'Staff'" src="/crown.png" width="20x" height="20px"> 
          </h4>
        </div>
        <br><br>
        <p align="center">
          <button class="backbtn" @click="backhome"><span> BACK </span></button>
        </p>
        <br>
      </div>
  
      <div class="content">
        <br><br><br>
        <h1>Staff Timesheet</h1><br>
        <h2>Please check your and your club member timesheet</h2><br>
  
        <!-- <ul v-if="staffList.length > 0">
          <li v-for="staff in staffList" :key="staff.username">
            {{ staff.username }} {{ name }} - Shift: {{ staff.workingShift }}
          </li>
        </ul>
        <p v-else>No staff working on this date.</p>
   -->
        <form align="center">
          <input
            class="datepicker"
            type="date"
            v-model="selectedDate"
            :min="minDate"
            :max="maxDate"
          />
        </form>


        <!-- SAVE button -->
      <center>
        <button class="submit" @click="checkSchedule">CHECK</button>
      </center>


      <ul v-if="staffList.length > 0">
          <li v-for="staff in staffList" :key="staff.username">
            {{ staff.username }} {{ name }} - Shift: {{ staff.workingShift }}
          </li>
        </ul>
      <p v-else>No staff working on this date.</p>
      
      </div>
  

    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import NotToken from '../components/NotToken.vue';
  export default {
    data() {
      return {
        roleName: '',
        name: '',
        selectedDate: '',
        minDate: '',
        maxDate: '',
        staffList: [], // เก็บข้อมูลสต๊าฟที่ดึงมาจาก backend
      };
    },
    methods: {
    backhome() {
    if (this.roles == '2') {
        this.$router.push('/superStaff-home');
    } else if (this.roles == '3') {
        this.$router.push('/staff-home');
    }
    },
    checkSchedule() {
    if (!this.selectedDate) {
        alert('กรุณาเลือกวันที่ก่อนตรวจสอบ');
    return;
    }

    axios
      .get('http://localhost:3000/staffTimesheet', {
        params: { selectedDate: this.selectedDate }
      })
      .then((response) => {
        if (response.data.staff) {
          this.staffList = response.data.staff; // เก็บข้อมูลสต๊าฟใน staffList
        } else {
          this.staffList = []; // ถ้าไม่มีข้อมูล ให้ล้างรายการ
          alert(response.data.message || 'No staff found');
        }
      })
      .catch((error) => {
        console.error('Error fetching staff schedule:', error);
        alert('ไม่สามารถดึงข้อมูลได้');
      });
        },
    },
    mounted() {
      // Get today's date
      const today = new Date();
  
      // Set the minimum date to today
      this.minDate = today.toISOString().split('T')[0];

      this.tomorrow 
  
      // Set the maximum date from localStorage (if available)
      this.maxDate = localStorage.getItem('endDate') || '';
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
  }
  </script>
  
  <style scoped>
  @import '@/assets/css/Operation.css';
  </style>
  