<template>
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/core/main.css">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid/main.css">
      <div ref="calendarString"></div>
      <div>hello</div>
    </div>
  </template>
  
  <script>
  import { onMounted } from 'vue';
  import { Calendar } from '@fullcalendar/core';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import interactionPlugin from '@fullcalendar/interaction';
  import axios from 'axios';
  
  export default {
    data() {
      return {
        calendarString: null,
        holidays: [],
      };
    },
    mounted() {
      this.fetchHolidays();
      if (this.$refs.calendarString) {
        const calendar = new Calendar(this.$refs.calendarString, {
          plugins: [dayGridPlugin, interactionPlugin],
          events: this.holidays,
          eventDisplay: 'background', // เพิ่ม eventDisplay
        });
        calendar.render();
        console.log(this.holidays); // ตรวจสอบข้อมูลวันหยุด
      } else {
        console.error('calendarString is null');
      }
    },
    methods: {
      async fetchHolidays() {
        try {
          const response = await axios.get('http://localhost:3000/thaiHolidays');
          this.holidays = response.data.holidays
            .filter(holiday => holiday.public)
            .map((holiday) => ({
              start: holiday.date,
              end: holiday.date,
              backgroundColor: 'red !important', // เพิ่ม !important
              display: 'background',
            }));
        } catch (error) {
          console.error('Error fetching holidays:', error);
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .calendar {
    max-width: 900px;
    margin: 0 auto;
  }
  </style>
  
  
  
  