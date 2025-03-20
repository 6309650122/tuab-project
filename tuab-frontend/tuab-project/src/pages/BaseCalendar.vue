<template>
    <div class="calendar-container">
      <div class="calendar-header">
        <button @click="changeMonth(-1)" class="btn-nav">&lt;</button>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <button @click="changeMonth(1)" class="btn-nav">&gt;</button>
      </div>
  
      <!-- ตำแหน่งสำหรับเนื้อหาด้านบนปฏิทิน -->
      <slot name="above-calendar"></slot>
      
      <div class="calendar-grid">
        <!-- วันในสัปดาห์ - เริ่มต้นจากวันอาทิตย์ -->
        <div v-for="day in weekDays" :key="day" class="calendar-weekday">
          {{ day }}
        </div>
        
        <!-- วันในเดือน -->
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="getDayClasses(day)"
          @click="handleDateClick(day)"
          :title="getDayTitle(day)"
        >
          <div class="day-number">{{ day.date.getDate() }}</div>
          <slot name="day-content" :day="day"></slot>
        </div>
      </div>
  
      <!-- ตำแหน่งสำหรับเนื้อหาด้านล่างปฏิทิน -->
      <slot name="below-calendar"></slot>
    </div>
  </template>
  
  <script>
  import NotToken from '../components/NotToken.vue';
  export default {
    name: 'BaseCalendar',
    props: {
      // ค่าเริ่มต้นสำหรับวันที่ปัจจุบัน
      initialDate: {
        type: Date,
        default: () => new Date()
      },
      // ชื่อวันในสัปดาห์
      weekDayLabels: {
        type: Array,
        default: () => ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
      },
      // ฟังก์ชันสำหรับตรวจสอบว่าวันนั้นปิดทำการหรือไม่
      isClosedFunction: {
        type: Function,
        default: (date) => date.getDay() === 0 || date.getDay() === 6 // ค่าเริ่มต้นคือวันเสาร์และวันอาทิตย์
      },
      // วันหยุด
      holidays: {
        type: Array,
        default: () => []
      },
      // วันพิเศษ
      specialDays: {
        type: Array,
        default: () => []
      },
      // ฟังก์ชันสำหรับแสดงชื่อวันหยุดหรือวันพิเศษ
      getDayTitleFunction: {
        type: Function,
        default: null
      },
      // ฟังก์ชันสำหรับกำหนด class ของวัน
      getDayClassesFunction: {
        type: Function,
        default: null
      },
      // ฟังก์ชันสำหรับตรวจสอบว่าวันนั้นเลือกได้หรือไม่
      isDateSelectableFunction: {
        type: Function,
        default: null
      }
    },
    data() {
      return {
        currentDate: new Date(this.initialDate),
        selectedDate: null
      }
    },
    computed: {
      weekDays() {
        return this.weekDayLabels;
      },
      currentMonthName() {
        const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        return months[this.currentDate.getMonth()];
      },
      currentYear() {
        // แสดงปีเป็น พ.ศ.
        return this.currentDate.getFullYear() + 543;
      },
      calendarDays() {
        const monthStart = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const monthEnd = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(monthStart);
        const endDate = new Date(monthEnd);
        
        // ปรับให้เริ่มต้นจากวันอาทิตย์ของสัปดาห์แรกของเดือน (วันอาทิตย์คือ 0)
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        
        // ปรับให้สิ้นสุดที่วันเสาร์ของสัปดาห์สุดท้ายของเดือน
        const endDayOfWeek = endDate.getDay();
        if (endDayOfWeek < 6) {
          endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));
        }
        
        const days = [];
        let day = new Date(startDate);
        
        while (day <= endDate) {
          const isOutsideMonth = day.getMonth() !== this.currentDate.getMonth();
          const isClosed = this.isClosedFunction ? this.isClosedFunction(day) : false;
          const isHoliday = this.isHoliday(day);
          const isSpecialDay = this.isSpecialDay(day);
          const holidayName = isHoliday ? this.getHolidayName(day) : '';
          const specialDayName = isSpecialDay ? this.getSpecialDayName(day) : '';
          
          // คำนวณ isSpecialBookableDay
          const isSpecialBookableDay = isSpecialDay && !isHoliday && !isClosed && !isOutsideMonth;
          
          days.push({
            date: new Date(day),
            isOutsideMonth,
            isClosed,
            isHoliday,
            isSpecialDay,
            isSpecialBookableDay,
            holidayName,
            specialDayName
          });
          
          day.setDate(day.getDate() + 1);
        }
        
        return days;
      }
    },
    methods: {
      async changeMonth(increment) {
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        this.currentDate = newDate;
        
        // ส่ง event เมื่อเปลี่ยนเดือน
        this.$emit('month-changed', {
          year: newDate.getFullYear(),
          month: newDate.getMonth(),
          date: new Date(newDate)
        });
      },
      handleDateClick(day) {
        // ตรวจสอบว่าวันนี้เลือกได้หรือไม่
        if (this.isDateSelectableFunction) {
          if (!this.isDateSelectableFunction(day)) {
            return; // ถ้าเลือกไม่ได้ ไม่ทำอะไร
          }
        } else {
          // ตรรกะเริ่มต้น
          if (!((!day.isOutsideMonth && !day.isClosed && !day.isHoliday) || day.isSpecialBookableDay)) {
            return;
          }
        }
        
        this.selectedDate = day.date;
        
        // ส่ง event เมื่อเลือกวัน
        this.$emit('date-selected', {
          date: day.date,
          formattedDate: this.formatDateParam(day.date),
          day: day
        });
      },
      isHoliday(date) {
        // ตรวจสอบว่าเป็นวันหยุดหรือไม่
        return this.holidays.some(holiday => 
          this.isSameDate(new Date(holiday.date), date)
        );
      },
      isSpecialDay(date) {
        // ตรวจสอบว่าเป็นวันพิเศษหรือไม่
        return this.specialDays.some(day => 
          this.isSameDate(new Date(day.date), date)
        );
      },
      isSameDate(date1, date2) {
        return date1.getDate() === date2.getDate() && 
               date1.getMonth() === date2.getMonth() && 
               date1.getFullYear() === date2.getFullYear();
      },
      getHolidayName(date) {
        // หาชื่อวันหยุด
        const holiday = this.holidays.find(h => 
          this.isSameDate(new Date(h.date), date)
        );
        
        return holiday ? holiday.name : "";
      },
      getSpecialDayName(date) {
        // หาชื่อวันพิเศษ
        const specialDay = this.specialDays.find(day => 
          this.isSameDate(new Date(day.date), date)
        );
        
        return specialDay ? specialDay.name : "";
      },
      getDayClasses(day) {
        // ใช้ฟังก์ชันที่ส่งมาจาก props ถ้ามี
        if (this.getDayClassesFunction) {
          return this.getDayClassesFunction(day);
        }
        
        // ตรรกะเริ่มต้น
        return [
          'calendar-day',
          { 'special-bookable-day': day.isSpecialBookableDay },
          { 'outside-month': day.isOutsideMonth },
          { 'closed-day': day.isClosed },
          { 'holiday-day': day.isHoliday },
          { 'special-day': day.isSpecialDay && !day.isHoliday && !day.isClosed && !day.isSpecialBookableDay },
          { 'open-day': !day.isOutsideMonth && !day.isClosed && !day.isHoliday && !day.isSpecialDay }
        ];
      },
      getDayTitle(day) {
        // ใช้ฟังก์ชันที่ส่งมาจาก props ถ้ามี
        if (this.getDayTitleFunction) {
          return this.getDayTitleFunction(day);
        }
        
        // ตรรกะเริ่มต้น
        if (day.isHoliday) return day.holidayName;
        if (day.isSpecialDay) return day.specialDayName;
        return '';
      },
      formatDateParam(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
    },
    watch: {
      initialDate: {
        handler(newVal) {
          this.currentDate = new Date(newVal);
        }
      }
    },
    mixins: [NotToken]
  }
  </script>
  
  <style scoped>
    @import '@/assets/css/Calendar.css';
  </style>