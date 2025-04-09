<template>
    <div class="calendar-container">
      <!-- ส่วนหัวของปฏิทิน -->
      <div class="calendar-header">
        <button @click="changeMonth(-1)" class="btn-nav">&lt;</button>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <button @click="changeMonth(1)" class="btn-nav">&gt;</button>
      </div>
      
      <!-- คำอธิบายสีต่างๆ ในปฏิทิน -->
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
        <div class="legend-item">
          <span class="legend-color bg-operation"></span>
          <span>วันที่ตั้งค่าเปิดทำการ</span>
        </div>
      </div>
      
      <!-- ส่วนของการตั้งค่าวันเปิด-ปิดสนาม (สำหรับ SuperStaff) -->
      <div class="operation-settings">
        <form @submit.prevent="submitOperationForm" class="operation-form">
          <div class="form-group">
            <label>วันที่เริ่มต้น</label>
            <input 
              type="date" 
              v-model="startDate" 
              :min="minDate" 
              class="form-control"
              required
              readonly
              @click="isSelectingStartDate = true"
            >
          </div>
          
          <div class="form-group">
            <label>วันที่สิ้นสุด</label>
            <input 
              type="date" 
              v-model="endDate" 
              :min="nextDayStartDate" 
              class="form-control"
              required
              readonly
              @click="isSelectingEndDate = true"
            >
          </div>
          
          <button type="submit" class="btn-add" :disabled="isSubmitting">บันทึก</button>
        </form>
      </div>
      
      <!-- กริดปฏิทิน -->
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
            { 'past-date': day.isPastDate },
            { 'operation-day': day.isOperationDay },
            { 'selected-start-date': isSameDate(day.date, new Date(startDate)) },
            { 'selected-end-date': isSameDate(day.date, new Date(endDate)) },
            { 'in-selected-range': isDateInSelectedRange(day.date) }
          ]"
          @click="handleDateClick(day)"
          :title="day.isHoliday ? day.holidayName : day.isSpecialDay ? day.specialDayName : ''"
        >
          <div class="day-number">{{ day.date.getDate() }}</div>
          <div v-if="day.isHoliday" class="holiday-name">{{ day.holidayName }}</div>
          <div v-else-if="day.isSpecialDay" class="special-day-name">{{ day.specialDayName }}</div>
          <div v-if="day.isOperationDay" class="operation-indicator">●</div>
        </div>
      </div>
      
      <!-- Popup สำหรับแจ้งเตือน -->
      <div class="holiday-modal" v-if="showSuccessPopup">
        <div class="modal-content">
          <div class="modal-header">
            <h3>สำเร็จ</h3>
            <button class="btn-close" @click="closeSuccessPopup">&times;</button>
          </div>
          <div class="modal-body">
            <p>บันทึกข้อมูลเรียบร้อยแล้ว</p>
            <button class="btn-add" @click="closeSuccessPopup">ตกลง</button>
          </div>
        </div>
      </div>
      
      <div class="holiday-modal" v-if="showErrorPopup">
        <div class="modal-content">
          <div class="modal-header">
            <h3>ข้อผิดพลาด</h3>
            <button class="btn-close" @click="closeErrorPopup">&times;</button>
          </div>
          <div class="modal-body">
            <p>กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดที่แตกต่างกัน</p>
            <button class="btn-add" @click="closeErrorPopup">ปิด</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'OperationCalendar',
    data() {
      return {
        currentDate: new Date(),
        selectedDate: null,
        weekDays: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
        holidays: [],
        thaiHolidays: [
          // ข้อมูลสำรองสำหรับวันหยุดไทย
          { date: new Date(new Date().getFullYear(), 0, 1), name: 'วันขึ้นปีใหม่', type: 'national' },
          { date: new Date(new Date().getFullYear(), 3, 13), name: 'วันสงกรานต์', type: 'national' },
          { date: new Date(new Date().getFullYear(), 3, 14), name: 'วันสงกรานต์', type: 'national' },
          { date: new Date(new Date().getFullYear(), 3, 15), name: 'วันสงกรานต์', type: 'national' },
          { date: new Date(new Date().getFullYear(), 11, 31), name: 'วันสิ้นปี', type: 'national' }
        ],
        specialDays: [
          // ข้อมูลสำรองสำหรับวันพิเศษ
          { date: new Date(new Date().getFullYear(), 1, 14), name: 'วันวาเลนไทน์', type: 'special' },
          { date: new Date(new Date().getFullYear(), 9, 31), name: 'วันฮาโลวีน', type: 'special' },
          { date: new Date(new Date().getFullYear(), 11, 24), name: 'วันคริสต์มาสอีฟ', type: 'special' },
          { date: new Date(new Date().getFullYear(), 11, 25), name: 'วันคริสต์มาส', type: 'special' }
        ],
        buddhistHolidays: [],
        operationDays: [], // วันที่เปิดทำการ
        
        // สำหรับส่วนการตั้งค่า Operation
        startDate: '',
        endDate: '',
        minDate: new Date().toISOString().split('T')[0],
        isSubmitting: false,
        showSuccessPopup: false,
        showErrorPopup: false,
        operationID: null,
        
        // เพิ่มตัวแปรสำหรับการเลือกวันที่
        isSelectingStartDate: false,
        isSelectingEndDate: false
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
          const isPastDate = day < today;
          const isOperationDay = this.isDateInOperationRange(day);
          
          // ตรวจสอบว่าเป็นวันที่เปิดทำการพิเศษหรือไม่
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
            isPastDate,
            isOperationDay
          });
          
          day.setDate(day.getDate() + 1);
        }
        return days;
      },
      nextDayStartDate() {
        if (this.startDate) {
          const date = new Date(this.startDate);
          date.setDate(date.getDate() + 1);
          return date.toISOString().split('T')[0];
        } 
        return null;
      }
    },
    methods: {
      // เพิ่มฟังก์ชันตรวจสอบว่าวันที่อยู่ในช่วงที่เลือกหรือไม่
      isDateInSelectedRange(date) {
        if (!this.startDate || !this.endDate) return false;
        
        const checkDate = new Date(date);
        const rangeStart = new Date(this.startDate);
        const rangeEnd = new Date(this.endDate);
        
        checkDate.setHours(0, 0, 0, 0);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd.setHours(0, 0, 0, 0);
        
        return checkDate > rangeStart && checkDate < rangeEnd;
      },
      
      // ตรวจสอบว่าวันที่อยู่ในช่วงวันที่เปิดทำการหรือไม่
      isDateInOperationRange(date) {
        return this.operationDays.some(op => {
          const startDate = new Date(op.startDate);
          const endDate = new Date(op.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);
          date.setHours(0, 0, 0, 0);
          
          return date >= startDate && date <= endDate;
        });
      },
      
      isFieldClosed(date) {
        // วันเสาร์ (6) และ วันอาทิตย์ (0) = ปิด
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
        
        // โหลดข้อมูลวันหยุดใหม่เมื่อเปลี่ยนปี
        if (this.currentDate.getFullYear() !== new Date().getFullYear()) {
          this.fetchHolidays(this.currentDate.getFullYear());
        }
      },
  
      handleDateClick(day) {
        // ไม่สามารถเลือกวันที่นอกเดือน, วันที่ปิด, วันหยุด, หรือวันที่ผ่านไปแล้ว
        if (day.isOutsideMonth || day.isPastDate) {
          return;
        }
        
        if (this.isSelectingStartDate) {
          // ถ้ากำลังเลือกวันเริ่มต้น
          const formattedDate = this.formatDateParam(day.date);
          this.startDate = formattedDate;
          this.isSelectingStartDate = false;
          
          // ถ้ายังไม่มีวันสิ้นสุด หรือวันสิ้นสุดน้อยกว่าวันเริ่มต้น ให้เริ่มเลือกวันสิ้นสุดทันที
          if (!this.endDate || new Date(this.endDate) <= new Date(this.startDate)) {
            this.isSelectingEndDate = true;
            this.endDate = ''; // รีเซ็ตวันสิ้นสุด
          }
        } else if (this.isSelectingEndDate) {
          // ถ้ากำลังเลือกวันสิ้นสุด
          const formattedDate = this.formatDateParam(day.date);
          
          // ตรวจสอบว่าวันที่เลือกต้องมากกว่าวันเริ่มต้น
          if (new Date(formattedDate) <= new Date(this.startDate)) {
            this.showErrorPopup = true;
            return;
          }
          
          this.endDate = formattedDate;
          this.isSelectingEndDate = false;
        } else {
          // เลือกวันเริ่มต้นโดยปริยาย ถ้าไม่ได้อยู่ในโหมดเลือกวัน
          const formattedDate = this.formatDateParam(day.date);
          this.startDate = formattedDate;
          this.isSelectingEndDate = true; // เปลี่ยนเป็นโหมดเลือกวันสิ้นสุดต่อ
          this.endDate = ''; // รีเซ็ตวันสิ้นสุด
        }
        
        console.log(`เลือกวันที่: ${day.date.toLocaleDateString()} - startDate: ${this.startDate}, endDate: ${this.endDate}`);
      },
  
      formatDateParam(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      },
  
      // แก้ไขเป็น fetchHolidays แทน loadHolidays
      fetchHolidays(year = null) {
        const currentYear = year || this.currentDate.getFullYear();
        console.log('Loading holidays for year:', currentYear);
        
        try {
          // ดึงข้อมูลวันหยุดจาก Google API หรือใช้ข้อมูลสำรอง
          this.fetchHolidaysFromAPI(currentYear).catch(error => {
            console.error('Error loading holidays from API:', error);
            // ใช้ข้อมูลสำรอง
            this.useDefaultHolidays(currentYear);
          });
        } catch (error) {
          console.error('Error loading holidays:', error);
          // ใช้ข้อมูลสำรอง
          this.useDefaultHolidays(currentYear);
        }
        
        // เพิ่มวันพิเศษที่ต้องมี
        this.addSpecialDays(currentYear);
      },
      
      // แยกส่วนที่ดึงข้อมูลจาก API ออกมา
      async fetchHolidaysFromAPI(year) {
        try {
          // ดึงข้อมูลวันหยุดจาก Google API
          const response = await fetch(`http://localhost:3000/googleholidays?year=${year}`);
          
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
          const customResponse = await fetch(`http://localhost:3000/holidays?year=${year}`);
          if (customResponse.ok) {
            this.holidays = await customResponse.json();
            console.log('Custom holidays loaded:', this.holidays);
          }
        } catch (error) {
          throw error;
        }
      },
  
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
          { date: new Date(currentYear, 9, 31), name: 'วันฮาโลวีน', type: 'special' },
          { date: new Date(currentYear, 11, 24), name: 'วันคริสต์มาสอีฟ', type: 'special' },
          { date: new Date(currentYear, 11, 25), name: 'วันคริสต์มาส', type: 'special' }
        ];
      },
      
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
      
      // ฟังก์ชันบันทึกวันเปิด-ปิด
      submitOperationForm() {
        if (this.startDate && this.endDate && this.startDate === this.endDate) {
          this.showErrorPopup = true;
          return;
        }
  
        if (this.startDate && this.endDate && !this.isSubmitting && this.startDate !== this.endDate) {
          this.isSubmitting = true;
          
          const formData = {
            opID: this.operationID,
            Nstart: this.startDate,
            Nend: this.endDate
          };
  
          console.log('Sending form data:', formData);
  
          axios.post('http://localhost:3000/editoperation', formData)
            .then((response) => {
              console.log('Response from server:', response);
              this.showSuccessPopup = true;
              this.fetchOperationDays(); // ดึงข้อมูลวันเปิดทำการใหม่หลังจากบันทึก
            })
            .catch((error) => {
              console.error('Error inserting operation into database:', error);
            })
            .finally(() => {
              this.isSubmitting = false;
            });
        }
      },
      
      closeSuccessPopup() {
        this.showSuccessPopup = false;
      },
      
      closeErrorPopup() {
        this.showErrorPopup = false;
      },
      
      // ดึงข้อมูลวันที่เปิดทำการ
      fetchOperationDays() {
        axios.get('http://localhost:3000/checkoperation')
          .then(response => {
            if (response.data && response.data.length > 0) {
              // ปรับรูปแบบการเก็บข้อมูลเป็นรูปแบบที่สามารถนำไปใช้ได้ง่าย
              this.operationDays = response.data.map(op => {
                // แปลงรูปแบบวันที่ให้เป็น ISO String ถ้าจำเป็น
                let startDate = op.startDate;
                let endDate = op.endDate;
                
                if (typeof startDate === 'string' && startDate.includes('/')) {
                  const parts = startDate.split('/');
                  startDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                
                if (typeof endDate === 'string' && endDate.includes('/')) {
                  const parts = endDate.split('/');
                  endDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                
                return {
                  operationID: op.operationID,
                  startDate: startDate,
                  endDate: endDate
                };
              });
              
              // เก็บ operationID ล่าสุดสำหรับใช้ในการอัปเดต
              if (this.operationDays.length > 0) {
                this.operationID = this.operationDays[0].operationID;
              }
              
              console.log('Loaded operation days:', this.operationDays);
            } else {
              console.log('No operation days data received.');
              this.operationDays = [];
            }
          })
          .catch(error => {
            console.error('Error fetching operation days:', error);
            this.operationDays = [];
          });
      },
      
      // กลับไปหน้าหลัก
      backToHome() {
        this.$router.push('/superStaff-home');
      }
    },
    mounted() {
      console.log('Calendar component mounted');
      
      // โหลดข้อมูลวันหยุดและวันที่เปิดทำการเมื่อคอมโพเนนต์ถูกโหลด
      this.fetchHolidays();
      this.fetchOperationDays();
      
      // เพิ่มปุ่มกลับไปหน้าหลัก SuperStaff
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.backToHome();
        }
      });
    }
  }
  </script>
  
  <style scoped>
  /* ใช้ CSS ที่ส่งมา */
  @import '@/assets/css/OperationCalendar.css';
  @import '@/assets/css/Calendar.css';
  </style>