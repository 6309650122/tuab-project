<template>
  <div class="calendar-container">
    <!-- ส่วนหัวของปฏิทิน -->
    <div class="calendar-header">
  <button @click="changeMonth(-1)" class="btn-nav">&lt;</button>
  
  <!-- เพิ่ม dropdown ที่มี icon -->
  <div class="selected-month-display">
    <h2 @click="toggleMonthDropdown"><strong>{{ currentMonthName }} {{ currentYear }}</strong><i class="dropdown-icon">▼</i></h2>
    
    <!-- Dropdown panel -->
    <div v-if="showMonthDropdown" class="month-dropdown-panel" @click.stop>
      <div class="month-dropdown">
        <label>เดือน:</label>
        <select v-model="selectedMonth" @change="updateSelectedMonth">
          <option v-for="(month, index) in thaiMonths" :key="index" :value="index">
            {{ month }}
          </option>
        </select>
        
        <label>ปี:</label>
        <select v-model="selectedYear" @change="updateSelectedYear">
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        
        <button class="apply-date-btn" @click="applyDateSelection">ตกลง</button>
      </div>
    </div>
  </div>
  
  <button @click="changeMonth(1)" class="btn-nav">&gt;</button>
</div>
    
    <!-- คำอธิบายสีต่างๆ ในปฏิทิน -->
    <div class="calendar-legend">
      <div class="legend-item">
        <span class="legend-color bg-green"></span>
        <span class="legend-color bg-special"></span>
        <span>วันเปิดทำการ/วันพิเศษ (คลิกเพื่อเลือกช่วงเวลาเปิดสนาม)</span>
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
            :class="{ 'error-input': startDateError }"
          >
          <span v-if="startDateError" class="error-message">{{ startDateError }}</span>
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
            :class="{ 'error-input': endDateError }"
          >
          <span v-if="endDateError" class="error-message">{{ endDateError }}</span>
        </div>
        
        <button type="submit" class="btn-add" :disabled="isSubmitting || hasDateErrors">บันทึก</button>
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
          { 'holiday-day': day.isHoliday }, /* วันหยุดจะแสดงเป็นสีแดงเสมอ */
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
          <p>{{ errorMessage || 'กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดที่แตกต่างกัน' }}</p>
          <br>
          <button class="btn-add" @click="closeErrorPopup">ปิด</button>
        </div>
      </div>
    </div>

    <!-- Popup สำหรับกรอกคำอธิบาย (Description) -->
    <div class="holiday-modal" v-if="showDescriptionPopup">
      <div class="modal-content">
        <div class="modal-header">
          <h3>กรอกคำอธิบาย</h3>
          <button class="btn-close" @click="closeDescriptionPopup">&times;</button>
        </div>
        <div class="modal-body">
          <p>กรุณากรอกคำอธิบายสำหรับการเปิด-ปิดสนาม</p><br>
          <div class="form-group">
            <label>คำอธิบาย</label>
            <textarea 
              v-model="operationDescription" 
              class="form-control description-textarea" 
              placeholder="เช่น: เปิดทำการสำหรับภาคการศึกษาที่ 1/68"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-add" @click="saveWithDescription">บันทึก</button>
          </div>
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
      // คำนวณปีที่สามารถเลือกได้ (ปัจจุบัน และอีก 3 ปีถัดไป)
      const currentYear = new Date().getFullYear();
      const years = [currentYear];
      for (let i = 1; i <= 3; i++) {
        years.push(currentYear + i);
      }
      return {
        currentDate: new Date(),
        selectedDate: null,
        weekDays: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
        thaiMonths: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
        availableYears: years,
        selectedMonth: new Date().getMonth(),
        selectedYear: new Date().getFullYear(),
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
        weekendDaysInRange: [],
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
        isSelectingEndDate: false,
        showMonthDropdown: false,
        
         // สำหรับ description
        showDescriptionPopup: false,
        operationDescription: '',

        // เพิ่มตัวแปรสำหรับข้อความผิดพลาด
        startDateError: '',
        endDateError: '',
        errorMessage: '',
        
        // วันหยุดในช่วงที่เลือก
        holidaysInSelectedRange: []
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
        return this.currentDate.getFullYear();
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
      },

      hasDateErrors() {
        return this.startDateError !== '' || this.endDateError !== '';
      }
    },
    methods: {

      // อัพเดทเดือนและปีที่เลือกจาก dropdown
      updateSelectedMonth() {
        // ไม่ต้องปิด dropdown ทันทีหลังเลือกเดือน
        this.currentDate = new Date(this.currentDate.getFullYear(), this.selectedMonth, 1);
      },

      updateSelectedYear() {
        // ไม่ต้องปิด dropdown ทันทีหลังเลือกปี
        this.currentDate = new Date(this.selectedYear, this.currentDate.getMonth(), 1);
        // โหลดข้อมูลวันหยุดใหม่เมื่อเปลี่ยนปี
        this.fetchHolidays(this.selectedYear);
      },

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

      formatThaiDate(date) {
        // แปลงวันที่เป็นรูปแบบไทย (วัน/เดือน/ปี พ.ศ.)
        const thaiDay = date.getDate();
        const thaiMonth = this.thaiMonths[date.getMonth()];
        const thaiYear = date.getFullYear() + 543;
        
        return `${thaiDay} ${thaiMonth} ${thaiYear}`;
      },
  
      handleDateClick(day) {
      // ไม่สามารถเลือกวันที่นอกเดือน, วันที่ปิด, วันหยุด, หรือวันที่ผ่านไปแล้ว
      if (day.isOutsideMonth || day.isPastDate) {
        return;
      }
      
      // ไม่สามารถเลือกวันหยุดนักขัตฤกษ์เป็นวันเริ่มต้นหรือวันสิ้นสุด
      if (day.isHoliday) {
        this.showErrorPopup = true;
        this.errorMessage = `ไม่สามารถเลือกวันหยุดนักขัตฤกษ์ "${day.holidayName}" เป็นวันเริ่มต้นหรือวันสิ้นสุดได้`;
        return;
      }

      // ไม่สามารถเลือกวันเสาร์-อาทิตย์เป็นวันเริ่มต้นหรือวันสิ้นสุด
      if (day.isClosed) {
        this.showErrorPopup = true;
        this.errorMessage = `ไม่สามารถเลือกวันเสาร์-อาทิตย์เป็นวันเริ่มต้นหรือวันสิ้นสุดได้`;
        return;
      }
      
      if (this.isSelectingStartDate) {
        // ถ้ากำลังเลือกวันเริ่มต้น
        const formattedDate = this.formatDateParam(day.date);
        this.startDate = formattedDate;
        this.isSelectingStartDate = false;
        this.startDateError = ''; // ล้างข้อความผิดพลาด
        
        // ถ้ายังไม่มีวันสิ้นสุด หรือวันสิ้นสุดน้อยกว่าวันเริ่มต้น ให้เริ่มเลือกวันสิ้นสุดทันที
        if (!this.endDate || new Date(this.endDate) <= new Date(this.startDate)) {
          this.isSelectingEndDate = true;
          this.endDate = ''; // รีเซ็ตวันสิ้นสุด
          this.endDateError = ''; // ล้างข้อความผิดพลาด
        } else {
          // ตรวจสอบวันหยุดในช่วงที่เลือก
          this.checkHolidaysInRange();
        }
      } else if (this.isSelectingEndDate) {
        // ถ้ากำลังเลือกวันสิ้นสุด
        const formattedDate = this.formatDateParam(day.date);
        
        // ตรวจสอบว่าวันที่เลือกต้องมากกว่าวันเริ่มต้น
        if (new Date(formattedDate) <= new Date(this.startDate)) {
          this.showErrorPopup = true;
          this.errorMessage = 'วันสิ้นสุดต้องมาหลังวันเริ่มต้น';
          return;
        }
        
        this.endDate = formattedDate;
        this.isSelectingEndDate = false;
        this.endDateError = ''; // ล้างข้อความผิดพลาด
        
        // ตรวจสอบวันหยุดในช่วงที่เลือก
        this.checkHolidaysInRange();
      } else {
        // เลือกวันเริ่มต้นโดยปริยาย ถ้าไม่ได้อยู่ในโหมดเลือกวัน
        const formattedDate = this.formatDateParam(day.date);
        this.startDate = formattedDate;
        this.isSelectingEndDate = true; // เปลี่ยนเป็นโหมดเลือกวันสิ้นสุดต่อ
        this.endDate = ''; // รีเซ็ตวันสิ้นสุด
        this.startDateError = ''; // ล้างข้อความผิดพลาด
        this.endDateError = ''; // ล้างข้อความผิดพลาด
        this.holidaysInSelectedRange = []; // รีเซ็ตรายการวันหยุดในช่วง
      }
      
      console.log(`เลือกวันที่: ${day.date.toLocaleDateString()} - startDate: ${this.startDate}, endDate: ${this.endDate}`);
    },

      // เพิ่มฟังก์ชันตรวจสอบวันหยุดในช่วงที่เลือก
      checkHolidaysInRange() {
      if (!this.startDate || !this.endDate) {
        this.holidaysInSelectedRange = [];
        this.weekendDaysInRange = [];
        return;
      }
      
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      // รวมวันหยุดทั้งหมด
      const allHolidays = [
        ...this.thaiHolidays.map(h => ({ 
          date: new Date(h.date), 
          name: h.name 
        })),
        ...this.buddhistHolidays.map(h => ({ 
          date: new Date(h.date), 
          name: h.name 
        })),
        ...this.holidays
          .filter(h => h.type === 'holiday')
          .map(h => ({ 
            date: new Date(h.date), 
            name: h.name 
          }))
      ];
      
      // หาวันหยุดที่อยู่ในช่วงที่เลือก
      this.holidaysInSelectedRange = allHolidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate > start && holidayDate < end;
      });
      
      // หาวันเสาร์-อาทิตย์ที่อยู่ในช่วงที่เลือก
      const weekendDays = [];
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + 1); // เริ่มจากวันหลังวันเริ่มต้น
      
      while (currentDate < end) {
        // 0 คือวันอาทิตย์, 6 คือวันเสาร์
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          weekendDays.push({
            date: new Date(currentDate),
            name: currentDate.getDay() === 0 ? 'วันอาทิตย์' : 'วันเสาร์'
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      this.weekendDaysInRange = weekendDays;
      
      console.log('วันหยุดในช่วงที่เลือก:', this.holidaysInSelectedRange);
      console.log('วันเสาร์-อาทิตย์ในช่วงที่เลือก:', this.weekendDaysInRange);
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
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/googleholidays?year=${year}`);
          
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
          const customResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/holidays?year=${year}`);
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
          this.errorMessage = 'วันเริ่มต้นและวันสิ้นสุดต้องไม่เป็นวันเดียวกัน';
          return;
        }
        
        if (this.hasDateErrors) {
          this.showErrorPopup = true;
          this.errorMessage = 'กรุณาแก้ไขข้อผิดพลาดก่อนบันทึก';
          return;
        }

        if (this.startDate && this.endDate && !this.isSubmitting && this.startDate !== this.endDate) {
          // ตรวจสอบวันหยุดในช่วงที่เลือกอีกครั้ง
          this.checkHolidaysInRange();
          
          // แสดง popup ให้กรอก description แทนที่จะบันทึกทันที
          this.showDescriptionPopup = true;
        }
      },

      // ฟังก์ชันใหม่สำหรับปิด popup description
      closeDescriptionPopup() {
        this.showDescriptionPopup = false;
      },

      // ฟังก์ชันใหม่สำหรับบันทึกข้อมูลพร้อม description
      saveWithDescription() {
        this.isSubmitting = true;
        
        const formData = {
          // ไม่ส่ง opID ไป - เพื่อให้บันทึกเป็นรายการใหม่ทุกครั้ง
          // opID: this.operationID, --> ลบบรรทัดนี้ออก
          Nstart: this.startDate,
          Nend: this.endDate,
          description: this.operationDescription,
          holidaysInRange: this.holidaysInSelectedRange.length > 0 
            ? this.holidaysInSelectedRange.map(h => ({ 
                date: this.formatDateParam(h.date), 
                name: h.name 
              })) 
            : []
        };

        console.log('Sending form data:', formData);

        axios.post(`${import.meta.env.VITE_API_BASE_URL}/editoperation`, formData)
          .then((response) => {
            console.log('Response from server:', response);
            this.showSuccessPopup = true;
            this.showDescriptionPopup = false;
            this.operationDescription = ''; // รีเซ็ตค่า description
            this.fetchOperationDays(); // ดึงข้อมูลวันเปิดทำการใหม่
          })
          .catch((error) => {
            console.error('Error inserting operation into database:', error);
            this.showErrorPopup = true;
            this.errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error.response?.data?.message || error.message);
          })
          .finally(() => {
            this.isSubmitting = false;
          });
      },
      
      closeSuccessPopup() {
        this.showSuccessPopup = false;
      },
      
      closeErrorPopup() {
        this.showErrorPopup = false;
      },
      
      // ดึงข้อมูลวันที่เปิดทำการ
      fetchOperationDays() {
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/checkoperation`)
          .then(response => {
            if (response.data && response.data.length > 0) {
              // เก็บข้อมูลทั้งหมดที่ได้รับจาก API
              this.operationDays = response.data.map(op => {
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
                  endDate: endDate,
                  description: op.description
                };
              });
              
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

      // เพิ่มเมธอดใหม่
      toggleMonthDropdown() {
        this.showMonthDropdown = !this.showMonthDropdown;
        
        // เพิ่ม event listener เพื่อปิด dropdown เมื่อคลิกข้างนอก
        if (this.showMonthDropdown) {
          setTimeout(() => {
            document.addEventListener('click', this.closeMonthDropdown);
          }, 0);
        }
      },

      closeMonthDropdown(event) {
        // ตรวจสอบว่าคลิกนอกพื้นที่ dropdown หรือไม่
        const dropdown = document.querySelector('.month-dropdown-panel');
        const trigger = document.querySelector('.selected-month-display h2');
        
        if (dropdown && !dropdown.contains(event.target) && 
            trigger && !trigger.contains(event.target)) {
          this.showMonthDropdown = false;
          document.removeEventListener('click', this.closeMonthDropdown);
        }
      },

      applyDateSelection() {
        // อัพเดทวันที่และปิด dropdown
        this.currentDate = new Date(this.selectedYear, this.selectedMonth, 1);
        this.showMonthDropdown = false;
        document.removeEventListener('click', this.closeMonthDropdown);
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