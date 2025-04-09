<template>
    <div class="calendar-container">
      <div class="calendar-header">
        <button @click="changeMonth(-1)" class="btn-nav">&lt;</button>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <button @click="changeMonth(1)" class="btn-nav">&gt;</button>
      </div>
      
      <div class="calendar-legend">
        <div class="legend-item">
          <span class="legend-color bg-green"></span>
          <span>เปิดทำการ</span>
        </div>
        <div class="legend-item">
          <span class="legend-color bg-special"></span>
          <span>วันพิเศษ</span>
        </div>
        <div class="legend-item">
          <span class="legend-color bg-red"></span>
          <span>วันหยุดนักขัตฤกษ์</span>
        </div>
        <div class="legend-item">
          <span class="legend-color bg-gray"></span>
          <span>ปิดทำการ</span>
        </div>
      </div>
      
      <div class="calendar-grid">
        <!-- วันในสัปดาห์ - เริ่มต้นจากวันอาทิตย์ -->
        <div v-for="day in weekDays" :key="day" class="calendar-weekday">
          {{ day }}
        </div>
        
        <!-- วันในเดือน -->
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="[
            'calendar-day',
            { 'outside-month': day.isOutsideMonth },
            { 'closed-day': day.isClosed },
            { 'special-bookable-day': day.isSpecialBookableDay },
            { 'holiday-day': day.isHoliday },
            { 'special-day': day.isSpecialDay && !day.isHoliday && !day.isClosed && !day.isSpecialBookableDay },
            { 'open-day': !day.isOutsideMonth && !day.isClosed && !day.isHoliday && !day.isSpecialDay },
            { 'past-date': day.isPastDate }
          ]"
          @click="handleDateClick(day)"
          :title="day.isHoliday ? day.holidayName : day.isSpecialDay ? day.specialDayName : ''"
        >
          <div class="day-number">{{ day.date.getDate() }}</div>
          <div v-if="day.isHoliday" class="holiday-name">{{ day.holidayName }}</div>
          <div v-else-if="day.isSpecialDay" class="special-day-name">{{ day.specialDayName }}</div>
        </div>
      </div>
    </div>
    </template>
    
    <script>
    export default {
      name: 'CalendarComponent',
      props: {
        mode: {
          type: String,
          default: 'general'
        }
      },
      data() {
        return {
          currentDate: new Date(),
          selectedDate: null,
          weekDays: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
          holidays: [],
          thaiHolidays: [],
          specialDays: [],
          buddhistHolidays: []
        }
      },
      computed: {
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
          const today = new Date();
          today.setHours(0, 0, 0, 0); // รีเซ็ทเวลาให้เป็น 00:00:00 เพื่อเปรียบเทียบเฉพาะวันที่
          
          while (day <= endDate) {
            const isOutsideMonth = day.getMonth() !== this.currentDate.getMonth();
            const isClosed = this.isFieldClosed(day);
            const isHoliday = this.isHoliday(day);
            const isSpecialDay = this.isSpecialDay(day) || this.isCustomSpecialDay(day);
            const holidayName = isHoliday ? this.getHolidayName(day) : '';
            const specialDayName = isSpecialDay ? this.getSpecialDayName(day) || this.getCustomSpecialDayName(day) : '';
    
            // เพิ่มการตรวจสอบว่าเป็นวันที่ผ่านมาแล้วหรือไม่
            const isPastDate = day < today;
    
            // คำนวณ isSpecialBookableDay ให้ถูกต้อง
            const isSpecialBookableDay = isSpecialDay && !isHoliday && !isClosed && !isOutsideMonth && !isPastDate;
              
            days.push({
              date: new Date(day),
              isOutsideMonth,
              isClosed,
              isHoliday,
              isSpecialDay,
              isSpecialBookableDay,
              holidayName,
              specialDayName,
              isPastDate 
            });
            
            day.setDate(day.getDate() + 1);
          }
          return days;
        }
      },
      methods: {
        isFieldClosed(date) {
          // Define your own logic for closed days
          // Example: วันเสาร์ (6) และ วันอาทิตย์ (0) = ปิด
          return date.getDay() === 0 || date.getDay() === 6;
        },
    
        isHoliday(date) {
          // ตรวจสอบวันหยุด
          return this.thaiHolidays.some(holiday => 
            this.isSameDate(new Date(holiday.date), date)
          ) || this.buddhistHolidays.some(holiday => 
            this.isSameDate(new Date(holiday.date), date)
          ) || this.holidays.some(holiday => 
            this.isSameDate(new Date(holiday.date), date) && holiday.type === 'holiday'
          );
        },
    
        isSameDate(date1, date2) {
          return date1.getDate() === date2.getDate() && 
                  date1.getMonth() === date2.getMonth() && 
                  date1.getFullYear() === date2.getFullYear();
        },
    
        isSpecialDay(date) {
          return this.specialDays.some(day => 
            this.isSameDate(new Date(day.date), date)
          );
        },
    
        isCustomSpecialDay(date) {
          return this.holidays.some(holiday => 
            this.isSameDate(new Date(holiday.date), date) && holiday.type === 'special'
          );
        },
    
        getHolidayName(date) {
          // ตรวจสอบวันหยุดราชการ
          const thaiHoliday = this.thaiHolidays.find(h => 
            this.isSameDate(new Date(h.date), date)
          );
          
          if (thaiHoliday) return thaiHoliday.name;
          
          // ตรวจสอบวันหยุดทางศาสนา
          const buddhistHoliday = this.buddhistHolidays.find(h => 
            this.isSameDate(new Date(h.date), date)
          );
          
          if (buddhistHoliday) return buddhistHoliday.name;
          
          // ตรวจสอบวันหยุดที่กำหนดเพิ่มเติม
          const customHoliday = this.holidays.find(h => 
            this.isSameDate(new Date(h.date), date) && h.type === 'holiday'
          );
          
          return customHoliday ? customHoliday.name : "";
        },
    
        getSpecialDayName(date) {
          const specialDay = this.specialDays.find(day => 
            this.isSameDate(new Date(day.date), date)
          );
          
          return specialDay ? specialDay.name : "";
        },
    
        getCustomSpecialDayName(date) {
          const customSpecialDay = this.holidays.find(h => 
            this.isSameDate(new Date(h.date), date) && h.type === 'special'
          );
          
          return customSpecialDay ? customSpecialDay.name : "";
        },
    
        changeMonth(increment) {
          const newDate = new Date(this.currentDate);
          newDate.setMonth(newDate.getMonth() + increment);
          this.currentDate = newDate;
          
          // โหลดข้อมูลวันหยุดใหม่เมื่อเปลี่ยนปี (implement as needed)
          if (this.currentDate.getFullYear() !== new Date().getFullYear()) {
            this.loadHolidays(this.currentDate.getFullYear());
          }
        },
    
        handleDateClick(day) {
          if ((!day.isOutsideMonth && !day.isClosed && !day.isHoliday && !day.isPastDate) || 
              (day.isSpecialBookableDay && !day.isPastDate)) {
            this.selectedDate = day.date;
            const formattedDate = this.formatDateParam(day.date);
            console.log(`วันที่ที่เลือก: ${formattedDate}`);
            
            // Emit event when date is selected
            this.$emit('date-selected', formattedDate);
          }
        },
    
        formatDateParam(date) {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        },
    
        // Method that can be implemented to load holidays
        loadHolidays(year = null) {
          // Implement holiday loading logic
          console.log('Loading holidays for year:', year || new Date().getFullYear());
          
          // Example data for testing
          this.thaiHolidays = [
            { date: new Date(2025, 0, 1), name: 'วันขึ้นปีใหม่', type: 'national' }
          ];
          
          this.specialDays = [
            { date: new Date(2025, 1, 14), name: 'วันวาเลนไทน์', type: 'special' }
          ];
        },

        async loadHolidays(year = null) {
        const currentYear = year || this.currentDate.getFullYear();
        console.log('Loading holidays for year:', currentYear);
        
        try {
            // ดึงข้อมูลวันหยุดจาก Google API
            const response = await fetch(`http://localhost:3000/googleholidays?year=${currentYear}`);
            
            if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
            }
            
            const googleHolidays = await response.json();
            
            // แยกประเภทวันหยุด
            this.thaiHolidays = googleHolidays.filter(h => h.type === 'national');
            this.buddhistHolidays = googleHolidays.filter(h => h.type === 'buddhist');
            
            // กรองเฉพาะวันพิเศษ (special) จาก API
            this.specialDays = googleHolidays.filter(h => h.type === 'special').map(day => ({
            date: new Date(day.date),
            name: day.name,
            type: 'special'
            }));
            
            // ดึงข้อมูลวันหยุดที่ถูกจัดการไว้แล้ว (custom holidays)
            try {
            const customResponse = await fetch(`http://localhost:3000/holidays?year=${currentYear}`);
            if (customResponse.ok) {
                this.holidays = await customResponse.json();
                console.log('Custom holidays loaded:', this.holidays);
            }
            } catch (customError) {
            console.error('Error loading custom holidays:', customError);
            this.holidays = [];
            }
            
        } catch (error) {
            console.error('Error loading holidays:', error);
            // ใช้ข้อมูลสำรอง
            this.useDefaultHolidays(currentYear);
        }
        },

        // เพิ่ม method สำรองกรณี API ไม่ทำงาน
        useDefaultHolidays(year = null) {
        const currentYear = year || new Date().getFullYear();
        
        this.thaiHolidays = [
            { date: new Date(currentYear, 0, 1), name: 'วันขึ้นปีใหม่', type: 'national' },
            { date: new Date(currentYear, 3, 13), name: 'วันสงกรานต์', type: 'national' },
            { date: new Date(currentYear, 3, 14), name: 'วันสงกรานต์', type: 'national' },
            { date: new Date(currentYear, 3, 15), name: 'วันสงกรานต์', type: 'national' },
            { date: new Date(currentYear, 11, 31), name: 'วันสิ้นปี', type: 'national' }
        ];
        
        this.buddhistHolidays = [];
        this.specialDays = [
            { date: new Date(currentYear, 1, 14), name: 'วันวาเลนไทน์', type: 'special' },
            { date: new Date(currentYear, 11, 24), name: 'วันคริสต์มาสอีฟ', type: 'special' },
            { date: new Date(currentYear, 11, 25), name: 'วันคริสต์มาส', type: 'special' }
        ];
        this.holidays = [];
        },
        // เพิ่มวันพิเศษ
        addSpecialDays(year) {
        const mustHaveSpecialDays = [
            { date: new Date(year, 1, 14), name: 'วันวาเลนไทน์' },
            { date: new Date(year, 9, 31), name: 'วันฮาโลวีน' },
            { date: new Date(year, 11, 24), name: 'วันคริสต์มาสอีฟ' },
            { date: new Date(year, 11, 25), name: 'วันคริสต์มาส' }
        ];
        
        for (const specialDay of mustHaveSpecialDays) {
            const exists = this.specialDays.some(day => 
            this.isSameDate(new Date(day.date), specialDay.date)
            );
            
            if (!exists) {
            this.specialDays.push({
                date: specialDay.date,
                name: specialDay.name,
                type: 'special'
            });
            }
          }
        },

        // เพิ่ม method สำรองกรณี API ไม่ทำงาน
        useDefaultHolidays(year = null) {
        const currentYear = year || new Date().getFullYear();
        
        this.thaiHolidays = [
            { date: new Date(currentYear, 0, 1), name: 'วันขึ้นปีใหม่', type: 'national' },
            { date: new Date(currentYear, 3, 13), name: 'วันสงกรานต์', type: 'national' },
            { date: new Date(currentYear, 3, 14), name: 'วันสงกรานต์', type: 'national' },
            { date: new Date(currentYear, 3, 15), name: 'วันสงกรานต์', type: 'national' },
            { date: new Date(currentYear, 11, 31), name: 'วันสิ้นปี', type: 'national' }
        ];
        
        this.buddhistHolidays = [];
        this.specialDays = [];
        }
      },
      mounted() {
        console.log('Calendar component mounted');
        // Load initial holidays
        this.loadHolidays();
      }
    }
    </script>
    
    <style scoped>
    @import '@/assets/css/StaffShiftCalendar.css';
    </style>