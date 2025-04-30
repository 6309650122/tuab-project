<template>
  <div class="dashboard-container">
    <h1>Dashboard</h1>
    
    <!-- ส่วนหัวที่ปรับปรุงใหม่ -->
    <div class="header-section">
      <div class="current-date">วันที่ปัจจุบัน: {{ formatCurrentDate() }}</div>
      <div class="date-filter">
        <button :class="{ active: dateRange === 'today' }" @click="setDateRange('today')">วันนี้</button>
        <button :class="{ active: dateRange === 'week' }" @click="setDateRange('week')">สัปดาห์นี้</button>
        <button :class="{ active: dateRange === 'month' }" @click="setDateRange('month')">เดือนนี้</button>
        <button :class="{ active: dateRange === '3months' }" @click="setDateRange('3months')">3 เดือน</button>
        <button :class="{ active: dateRange === 'custom' }" @click="setDateRange('custom')">กำหนดเอง</button>
      </div>
      <div v-if="dateRange === 'custom'" class="custom-date-section">
        <div class="custom-date-container">
          <input type="date" v-model="startDate" class="custom-date-input" />
          <span>ถึง</span>
          <input type="date" v-model="endDate" class="custom-date-input" />
          <button @click="applyCustomRange" class="submit-btn">ตกลง</button>
        </div>
      </div>
    </div>
  
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>กำลังโหลดข้อมูล...</p>
    </div>
  
    <div v-else class="superstaff-dashboard">
      <div class="summary-cards">
        <div class="card">
          <h3>การจองทั้งหมด</h3>
          <div class="card-value">{{ dashboardData.summary.totalBookings }}</div>
        </div>
        <div class="card pending">
          <h3>รอดำเนินการ</h3>
          <div class="card-value">{{ dashboardData.summary.pendingBookings }}</div>
        </div>
        <div class="card confirmed">
          <h3>ยืนยันแล้ว</h3>
          <div class="card-value">{{ dashboardData.summary.confirmedBookings }}</div>
        </div>
        <div class="card cancelled">
          <h3>ยกเลิกแล้ว</h3>
          <div class="card-value">{{ dashboardData.summary.cancelledBookings }}</div>
        </div>
      </div>
  
      <div class="charts-grid">
        <!-- กราฟสำหรับฟิลเตอร์ "วันนี้" -->
        <div v-if="dateRange === 'today'" class="chart-card">
          <h2>การจองตาม Shift</h2>
          <canvas ref="shiftBookingsChart" style="height: 300px; width: 100%;"></canvas>
        </div>
        
        <!-- กราฟรายวัน - สำหรับฟิลเตอร์สัปดาห์และเดือน -->
        <div v-if="['week', 'month', 'custom'].includes(dateRange) && customDateRangeDuration < 32" class="chart-card">
          <h2>การจองรายวัน</h2>
          <canvas ref="dailyBookingsChart" style="height: 300px; width: 100%;"></canvas>
        </div>
        
        <!-- กราฟรายเดือน - สำหรับฟิลเตอร์ 3 เดือนและกำหนดเองที่มากกว่า 31 วัน -->
        <div v-if="dateRange === '3months' || (dateRange === 'custom' && customDateRangeDuration >= 32)" class="chart-card">
          <h2>การจองรายเดือน</h2>
          <canvas ref="monthlyBookingsChart" style="height: 300px; width: 100%;"></canvas>
        </div>
        
        <!-- สถานะการจอง (Pie chart สำหรับวันนี้) -->
        <div v-if="dateRange === 'today'" class="chart-card">
          <h2>สถานะการจอง</h2>
          <canvas ref="bookingStatusPieChart" style="height: 300px; width: 100%;"></canvas>
        </div>
        
        <!-- สถานะการจอง (Stack Bar chart สำหรับสัปดาห์, เดือน, 3 เดือน) -->
        <div v-if="dateRange !== 'today'" class="chart-card">
          <h2>สถานะการจอง</h2>
          <canvas ref="bookingStatusStackedChart" style="height: 300px; width: 100%;"></canvas>
        </div>
        
        <!-- การใช้งานแต่ละช่องยิง (ทุกฟิลเตอร์) -->
        <div class="chart-card">
          <h2>การใช้งานแต่ละช่องยิง</h2>
          <canvas ref="laneUsageChart" style="height: 300px; width: 100%;"></canvas>
        </div>
        
        <!-- การจองแยกตามคณะและบุคลากร (ทุกฟิลเตอร์) -->
        <div class="chart-card">
          <h2>การจองแยกตามคณะและบุคลากร</h2>
          <canvas ref="facultyPieChart" style="height: 300px; width: 100%;"></canvas>
        </div>
      </div>
      
      <div class="staff-performance">
        <h2>ประสิทธิภาพของ Staff แต่ละคน</h2>
        <div class="staff-filter">
          <select v-model="selectedStaff" @change="filterByStaff">
            <option value="">ทั้งหมด</option>
            <option v-for="staff in staffList" :key="staff.username" :value="staff.username">
              {{ staff.name }}
            </option>
          </select>
        </div>
        <canvas ref="staffPerformanceChart" style="height: 300px; width: 100%;"></canvas>
      </div>

      <div class="staff-timesheet">
        <h2>การลงชิฟท์ของ Staff แต่ละคน</h2>
        <canvas ref="staffShiftsChart" style="height: 300px; width: 100%;"></canvas>
      </div>
    </div>
  </div>
</template>
  
  <script>
  import { VueGoodTable } from 'vue-good-table';
  import Chart from 'chart.js';
  import axios from 'axios';
  import NotToken from '../components/NotToken.vue';
  
  export default {
    components: {
      VueGoodTable
    },
    data() {
      return {
        loading: true,
        dateRange: 'month',
        startDate: '',
        endDate: '',
        selectedStaff: '',
  
        selectedPeriod: 'today',  // เช่น วันนี้, สัปดาห์นี้, 3 เดือน
        chartData: null,          // ข้อมูลที่ใช้สร้างกราฟ
        
        showBookingModal: false,
        selectedBooking: {},
        customDateRangeDuration: 0,
        
        dashboardData: {
          summary: {
            totalBookings: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            cancelledBookings: 0
          },
          bookingsByDate: [],
          bookingsByMonth: [],
          bookingsByLane: [],
          staffPerformance: [],
          staffShifts: [],
          recentBookings: [],
          bookingsByShift: [], // ข้อมูลการจองแยกตาม shift
          bookingsByFaculty: []
        },
        
        staffList: [],
        
        // กราฟสำหรับ Chart.js
        charts: {
          bookingStatusChart: null,
          dailyBookingsChart: null,
          monthlyBookingsChart: null,
          laneUsageChart: null,
          staffPerformanceChart: null,
          staffShiftsChart: null,
          shiftBookingsChart: null,
          bookingStatusPieChart: null,
          bookingStatusStackedChart: null,
          facultyPieChart: null
        },
        
        // คอลัมน์สำหรับตาราง
        bookingColumns: [
          { label: 'รหัสการจอง', field: 'id' },
          { label: 'ชื่อผู้จอง', field: 'userName' },
          { label: 'เลขประจำตัว', field: 'username' },
          { label: 'เลน', field: 'lane' },
          { label: 'วันที่', field: 'date' },
          { label: 'เวลา', field: 'time' },
          { label: 'สถานะ', field: 'status' },
          { label: 'การจัดการ', field: 'actions', sortable: false }
        ]
      };
    },
    
    async mounted() {
        try {
            this.initDateRange();
            this.calculateCustomDateRange(); // เพิ่มบรรทัดนี้
            await this.fetchDashboardData();
        } catch (error) {
            console.error("Error loading data:", error);
        }

        this.username = localStorage.getItem("username");
        this.name = localStorage.getItem("name") || '';
        this.roleName = localStorage.getItem("roleName") || '';
        this.roles = localStorage.getItem("roles") || '';
    },
            
    methods: {

        calculateCustomDateRange() {
  if (this.dateRange !== 'custom') {
    // กำหนดค่าสำหรับช่วงอื่นๆ ที่ไม่ใช่ custom
    switch (this.dateRange) {
      case 'today':
        this.customDateRangeDuration = 1;
        break;
      case 'week':
        this.customDateRangeDuration = 7;
        break;
      case 'month':
        const now = new Date();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        this.customDateRangeDuration = lastDayOfMonth;
        break;
      case '3months':
        this.customDateRangeDuration = 90; // ประมาณ 3 เดือน
        break;
      default:
        this.customDateRangeDuration = 30; // ค่าเริ่มต้น
    }
    console.log(`Set customDateRangeDuration for ${this.dateRange}: ${this.customDateRangeDuration}`);
    return;
  }
  
  // สำหรับ custom date range
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
    // คำนวณจำนวนวันระหว่างวันที่เริ่มต้นและวันที่สิ้นสุด
    const diffTime = Math.abs(end - start);
    this.customDateRangeDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 เพื่อรวมวันสุดท้าย
    console.log(`Calculated customDateRangeDuration for custom range: ${this.customDateRangeDuration}`);
  } else {
    this.customDateRangeDuration = 0;
    console.warn("Invalid date range provided");
  }
},  
      initDateRange() {
        const now = new Date();
        
        // สำหรับ custom date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1); // เริ่มจาก 1 เดือนก่อน
        
        this.startDate = this.formatDateForInput(startDate);
        this.endDate = this.formatDateForInput(endDate);
      },
      
      setDateRange(range) {
        this.dateRange = range;
        this.calculateCustomDateRange(); // เพิ่มบรรทัดนี้
        this.fetchDashboardData();
        },
            
      applyCustomRange() {
        // ตรวจสอบว่ามีการระบุวันที่ครบถ้วนหรือไม่
        if (!this.startDate || !this.endDate) {
            alert('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด');
            return;
        }
                
        this.calculateCustomDateRange();
        this.fetchDashboardData();
      },
      
      getDateRangeParams() {
        const now = new Date();
        let start, end;
        
        switch (this.dateRange) {
          case 'today':
            start = this.formatDateForAPI(now);
            end = this.formatDateForAPI(now);
            break;
            
          case 'week':
            start = new Date(now);
            start.setDate(now.getDate() - now.getDay()); // วันแรกของสัปดาห์ (วันอาทิตย์)
            end = new Date(now);
            end.setDate(start.getDate() + 6); // วันสุดท้ายของสัปดาห์ (วันเสาร์)
            start = this.formatDateForAPI(start);
            end = this.formatDateForAPI(end);
            break;
            
          case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            start = this.formatDateForAPI(start);
            end = this.formatDateForAPI(end);
            break;
            
          case '3months':
            start = new Date(now);
            start.setMonth(now.getMonth() - 2);
            start.setDate(1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            start = this.formatDateForAPI(start);
            end = this.formatDateForAPI(end);
            break;
            
          case 'custom':
            start = this.startDate;
            end = this.endDate;
            break;
            
          default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            start = this.formatDateForAPI(start);
            end = this.formatDateForAPI(end);
        }
        
        return { start, end };
      },
      
      async fetchDashboardData() {
  this.loading = true;
  
  try {
    const { start, end } = this.getDateRangeParams();
    
    // 1. ดึงข้อมูลสรุป
    const summaryResponse = await axios.get('http://localhost:3000/dashboard/summary', {
      params: {
        staff: this.selectedStaff || undefined,
        start,
        end
      }
    });
    this.dashboardData.summary = summaryResponse.data;
    
    // 2. ดึงข้อมูลการจองตามวันที่ (พร้อมข้อมูลสถานะแล้ว)
    const bookingsByDateResponse = await axios.get('http://localhost:3000/dashboard/bookings-by-date', {
      params: {
        staff: this.selectedStaff || undefined,
        start,
        end
      }
    });
    this.dashboardData.bookingsByDate = bookingsByDateResponse.data;
    console.log('Bookings by date (with status):', this.dashboardData.bookingsByDate);
    
    // 3. ดึงข้อมูลการจองตามเดือน (พร้อมข้อมูลสถานะแล้ว)
    const bookingsByMonthResponse = await axios.get('http://localhost:3000/dashboard/bookings-by-month', {
      params: {
        year: new Date().getFullYear(),
        staff: this.selectedStaff || undefined
      }
    });
    this.dashboardData.bookingsByMonth = bookingsByMonthResponse.data;
    console.log('Bookings by month (with status):', this.dashboardData.bookingsByMonth);
    
    // 4. ดึงข้อมูลการจองตามเลน
    const bookingsByLaneResponse = await axios.get('http://localhost:3000/dashboard/bookings-by-lane', {
      params: {
        start,
        end
      }
    });
    this.dashboardData.bookingsByLane = bookingsByLaneResponse.data;
    
    // 5. ดึงข้อมูลประสิทธิภาพของ Staff
    const staffPerformanceResponse = await axios.get('http://localhost:3000/dashboard/staff-performance', {
      params: {
        start,
        end
      }
    });
    this.dashboardData.staffPerformance = staffPerformanceResponse.data;
    this.staffList = this.dashboardData.staffPerformance.map(staff => ({
      username: staff.username,
      name: staff.name
    }));
    
    // 6. ดึงข้อมูลการจัดตารางงานของ Staff
    const staffShiftsResponse = await axios.get('http://localhost:3000/countStaffShifts', {
      params: {
        start,
        end
      }
    });
    this.dashboardData.staffShifts = staffShiftsResponse.data;
    
    // 7. ดึงข้อมูลการจองตาม shift (สำหรับฟิลเตอร์วันนี้)
    if (this.dateRange === 'today') {
      const bookingsByShiftResponse = await axios.get('http://localhost:3000/dashboard/bookings-by-shift', {
        params: {
          date: start
        }
      });
      this.dashboardData.bookingsByShift = bookingsByShiftResponse.data;
    }
    
    // 8. ดึงข้อมูลการจองแยกตามคณะ
    const bookingsByFacultyResponse = await axios.get('http://localhost:3000/dashboard/bookings-by-faculty', {
      params: {
        start,
        end
      }
    });
    this.dashboardData.bookingsByFaculty = bookingsByFacultyResponse.data;
  
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    alert('เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง');
  } finally {
    this.loading = false;
    
    // สร้างกราฟหลังจากข้อมูลโหลดเสร็จและ DOM อัพเดตแล้ว
    this.$nextTick(() => {
      setTimeout(() => {
        // สร้างกราฟตามฟิลเตอร์ที่เลือก
        if (this.dateRange === 'today') {
          this.createShiftBookingsChart();
          this.createBookingStatusPieChart();
        } else {
          if (['week', 'month', 'custom'].includes(this.dateRange) && this.customDateRangeDuration < 32) {
            this.createDailyBookingsChart();
          }
          
          if (this.dateRange === '3months' || (this.dateRange === 'custom' && this.customDateRangeDuration >= 32)) {
            this.createMonthlyBookingsChart();
          }
          
          this.createBookingStatusStackedChart();
        }
        
        // สร้างกราฟที่แสดงในทุกฟิลเตอร์
        this.createLaneUsageChart();
        this.createFacultyPieChart();
        this.createStaffPerformanceChart();
        this.createStaffShiftsChart();
      }, 100);
    });
  }
},

      createShiftBookingsChart() {
        if (!this.$refs.shiftBookingsChart) {
            console.warn("ไม่เจอ shiftBookingsChart canvas!");
            return;
        }
        
        const ctx = this.$refs.shiftBookingsChart.getContext('2d');
        
        // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
        if (this.charts.shiftBookingsChart) {
            this.charts.shiftBookingsChart.destroy();
        }
        
        const shifts = ['17:00-17:30', '17:30-18:00'];
        const counts = [0, 0];
        
        // ถ้ามีข้อมูล ให้ใช้ข้อมูลจริง
        if (this.dashboardData.bookingsByShift && this.dashboardData.bookingsByShift.length > 0) {
            this.dashboardData.bookingsByShift.forEach(item => {
            if (item.shift === '17:00-17:30') {
                counts[0] = item.count;
            } else if (item.shift === '17:30-18:00') {
                counts[1] = item.count;
            }
            });
        }
        
        this.charts.shiftBookingsChart = new Chart(ctx, {
            type: 'bar',
            data: {
            labels: shifts,
            datasets: [{
                label: 'จำนวนการจอง',
                data: counts,
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
            },
            options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'ช่วงเวลา'
                }
                }],
                yAxes: [{
                ticks: {
                    beginAtZero: true,
                    callback: function(value) {
                    if (value % 1 === 0) {
                        return value;
                    }
                    }
                },
                scaleLabel: {
                    display: true,
                    labelString: 'จำนวนการจอง'
                }
                }]
            },
            tooltips: {
                callbacks: {
                label: function(tooltipItem, data) {
                    const dataset = data.datasets[tooltipItem.datasetIndex];
                    const value = dataset.data[tooltipItem.index];
                    const total = dataset.data.reduce((acc, val) => acc + val, 0);
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                    return `จำนวน: ${value} (${percentage}%)`;
                }
                }
            }
            }
        });
        },

        createBookingStatusPieChart() {
  if (!this.$refs.bookingStatusPieChart) {
    console.warn("ไม่เจอ bookingStatusPieChart canvas!");
    return;
  }
  
  const ctx = this.$refs.bookingStatusPieChart.getContext('2d');
  
  // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
  if (this.charts.bookingStatusPieChart) {
    this.charts.bookingStatusPieChart.destroy();
  }
  
  this.charts.bookingStatusPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['รอดำเนินการ', 'ยืนยันแล้ว', 'ยกเลิกแล้ว'],
      datasets: [{
        data: [
          this.dashboardData.summary.pendingBookings,
          this.dashboardData.summary.confirmedBookings,
          this.dashboardData.summary.cancelledBookings
        ],
        backgroundColor: ['rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(255, 99, 132, 0.7)'],
        borderColor: ['rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        position: 'bottom'
      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            const dataset = data.datasets[tooltipItem.datasetIndex];
            const value = dataset.data[tooltipItem.index];
            const total = dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${data.labels[tooltipItem.index]}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  });
},

createBookingStatusStackedChart() {
  if (!this.$refs.bookingStatusStackedChart) {
    console.warn("ไม่เจอ bookingStatusStackedChart canvas!");
    return;
  }
  
  const ctx = this.$refs.bookingStatusStackedChart.getContext('2d');
  
  // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
  if (this.charts.bookingStatusStackedChart) {
    this.charts.bookingStatusStackedChart.destroy();
  }
  
  // สำหรับการดีบัก
  console.log("Date Range:", this.dateRange);
  console.log("Custom Date Range Duration:", this.customDateRangeDuration);
  
  let labels = [];
  let pendingData = [];
  let confirmedData = [];
  let cancelledData = [];
  
  // กำหนดข้อมูลตามช่วงเวลาที่เลือก
  if (this.dateRange === 'week' || (this.dateRange === 'custom' && this.customDateRangeDuration <= 7) || 
      this.dateRange === 'month' || (this.dateRange === 'custom' && this.customDateRangeDuration > 7 && this.customDateRangeDuration < 32)) {
    // สำหรับสัปดาห์และเดือน: ใช้ข้อมูลรายวัน
    console.log("Using daily data:", this.dashboardData.bookingsByDate);
    
    if (this.dashboardData.bookingsByDate && this.dashboardData.bookingsByDate.length > 0) {
      labels = this.dashboardData.bookingsByDate.map(item => this.formatDateDisplay(item.date));
      
      pendingData = this.dashboardData.bookingsByDate.map(item => item.pendingCount || 0);
      confirmedData = this.dashboardData.bookingsByDate.map(item => item.confirmedCount || 0);
      cancelledData = this.dashboardData.bookingsByDate.map(item => item.cancelledCount || 0);
    } else {
      console.warn("No bookingsByDate data available");
    }
  } else {
    // สำหรับ 3 เดือนหรือกำหนดเองที่มากกว่า 31 วัน: ใช้ข้อมูลรายเดือน
    console.log("Using monthly aggregated data:", this.dashboardData.bookingsByMonth);
    
    if (this.dashboardData.bookingsByMonth && this.dashboardData.bookingsByMonth.length > 0) {
      labels = this.dashboardData.bookingsByMonth.map(item => item.month);
      pendingData = this.dashboardData.bookingsByMonth.map(item => item.pendingCount || 0);
      confirmedData = this.dashboardData.bookingsByMonth.map(item => item.confirmedCount || 0);
      cancelledData = this.dashboardData.bookingsByMonth.map(item => item.cancelledCount || 0);
    } else {
      console.warn("No bookingsByMonth data available");
    }
  }
  
  // สำหรับการดีบัก
  console.log("Chart Labels:", labels);
  console.log("Pending Data:", pendingData);
  console.log("Confirmed Data:", confirmedData);
  console.log("Cancelled Data:", cancelledData);
  
  // ใช้ข้อมูลตัวอย่างหากไม่มีข้อมูลจริง
  if (labels.length === 0) {
    if (this.dateRange === '3months' || (this.dateRange === 'custom' && this.customDateRangeDuration >= 32)) {
      labels = ['Jan', 'Feb', 'Mar'];
      pendingData = [5, 8, 3];
      confirmedData = [12, 15, 10];
      cancelledData = [2, 4, 1];
    } else {
      labels = ['01/04', '02/04', '03/04', '04/04', '05/04'];
      pendingData = [2, 3, 1, 4, 2];
      confirmedData = [5, 4, 6, 3, 5];
      cancelledData = [1, 0, 2, 1, 0];
    }
    console.log("Using sample data because no real data available");
  }
  
  // กำหนดสีแยกตามความหมายของสถานะ
  const pendingColor = 'rgba(255, 206, 86, 0.7)';  // สีเหลือง (รอดำเนินการ)
  const pendingBorder = 'rgba(255, 206, 86, 1)';
  
  const confirmedColor = 'rgba(75, 192, 192, 0.7)'; // สีเขียว (ยืนยันแล้ว)
  const confirmedBorder = 'rgba(75, 192, 192, 1)';
  
  const cancelledColor = 'rgba(255, 99, 132, 0.7)'; // สีแดง (ยกเลิกแล้ว)
  const cancelledBorder = 'rgba(255, 99, 132, 1)';
  
  this.charts.bookingStatusStackedChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'รอดำเนินการ',
          data: pendingData,
          backgroundColor: pendingColor,
          borderColor: pendingBorder,
          borderWidth: 1
        },
        {
          label: 'ยืนยันแล้ว',
          data: confirmedData,
          backgroundColor: confirmedColor,
          borderColor: confirmedBorder,
          borderWidth: 1
        },
        {
          label: 'ยกเลิกแล้ว',
          data: cancelledData,
          backgroundColor: cancelledColor,
          borderColor: cancelledBorder,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        xAxes: [{
          stacked: true,
          scaleLabel: {
            display: true,
            labelString: this.dateRange === '3months' || (this.dateRange === 'custom' && this.customDateRangeDuration >= 32) ? 'เดือน' : 'วันที่'
          }
        }],
        yAxes: [{
          stacked: true,
          ticks: {
            beginAtZero: true,
            callback: function(value) {
              if (value % 1 === 0) {
                return value;
              }
            }
          },
          scaleLabel: {
            display: true,
            labelString: 'จำนวนการจอง'
          }
        }]
      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            const dataset = data.datasets[tooltipItem.datasetIndex];
            const value = dataset.data[tooltipItem.index];
            const total = data.datasets.reduce((acc, dataset) => acc + (dataset.data[tooltipItem.index] || 0), 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${dataset.label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  });
  
  console.log("StackedChart created successfully");
},

// ฟังก์ชันสำหรับจัดกลุ่มคณะ
getFacultyGroup(facultyCode) {
  // กลุ่มวิทยาศาสตร์และเทคโนโลยี
  if (['09', '10', '16'].includes(facultyCode)) {
    return 'วิทยาศาสตร์และเทคโนโลยี';
  }
  // กลุ่มสังคมศาสตร์
  else if (['01', '03', '08', '05', '06'].includes(facultyCode)) {
    return 'สังคมศาสตร์และมนุษยศาสตร์';
  }
  // กลุ่มแพทยศาสตร์และสาธารณสุข
  else if (['11', '12', '13', '14', '17', '18'].includes(facultyCode)) {
    return 'แพทยศาสตร์และสาธารณสุข';
  }
  // กลุ่มศิลปะและการสื่อสาร
  else if (['07', '15'].includes(facultyCode)) {
    return 'ศิลปะและการสื่อสาร';
  }
  // กลุ่มบริหารและเศรษฐศาสตร์
  else if (['02', '04'].includes(facultyCode)) {
    return 'บริหารและเศรษฐศาสตร์';
  }
  // กลุ่มวิทยาลัยและสถาบัน
  else if (['21', '22', '23', '24', '26', '27', '28', '29', '30'].includes(facultyCode)) {
    return 'วิทยาลัยและสถาบัน';
  }
  // กลุ่มที่มีการเรียนข้ามคณะ
  else if (['64', '65', '66'].includes(facultyCode)) {
    return 'โครงการพิเศษ';
  }
  // กลุ่มบุคลากร
  else if (facultyCode === '' || isNaN(facultyCode)) {
    return 'บุคลากร';
  }
  // อื่นๆ
  else {
    return 'อื่นๆ';
  }
},

// ฟังก์ชันสำหรับประมวลผลข้อมูลการจองตามคณะ
processFacultyData(bookings) {
  const groupedData = {};
  
  // นับจำนวนการจองตามกลุ่มคณะ
  bookings.forEach(booking => {
    let facultyCode = '';
    
    // ถ้าเป็นนักศึกษา ให้ดึงรหัสคณะจาก username
    if (booking.username && booking.username.length >= 10 && !isNaN(booking.username.substr(0, 2))) {
      facultyCode = booking.username.substr(2, 2);
    }
    
    const group = this.getFacultyGroup(facultyCode);
    
    if (!groupedData[group]) {
      groupedData[group] = 0;
    }
    
    groupedData[group]++;
  });
  
  // แปลงข้อมูลให้อยู่ในรูปแบบที่ใช้กับ Chart.js
  const labels = Object.keys(groupedData);
  const data = Object.values(groupedData);
  
  return { labels, data };
},

createFacultyPieChart() {
  if (!this.$refs.facultyPieChart) {
    console.warn("ไม่เจอ facultyPieChart canvas!");
    return;
  }
  
  const ctx = this.$refs.facultyPieChart.getContext('2d');
  
  // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
  if (this.charts.facultyPieChart) {
    this.charts.facultyPieChart.destroy();
  }
  
  // ประมวลผลข้อมูลการจองตามคณะ (ต้องดึงข้อมูลการจองก่อน)
  const { labels, data } = this.processFacultyData(this.dashboardData.bookingsByFaculty || []);
  
  // กำหนดสีสำหรับแต่ละกลุ่ม
  const backgroundColors = [
    'rgba(255, 99, 132, 0.7)',  // สีแดง
    'rgba(54, 162, 235, 0.7)',  // สีฟ้า
    'rgba(255, 206, 86, 0.7)',  // สีเหลือง
    'rgba(75, 192, 192, 0.7)',  // สีเขียวอมฟ้า
    'rgba(153, 102, 255, 0.7)', // สีม่วง
    'rgba(255, 159, 64, 0.7)',  // สีส้ม
    'rgba(100, 100, 100, 0.7)'  // สีเทา (สำหรับบุคลากรหรืออื่นๆ)
  ];
  
  this.charts.facultyPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: backgroundColors.map(color => color.replace('0.7', '1')).slice(0, labels.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          font: {
            size: 12
          }
        }
      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            const label = data.labels[tooltipItem.index] || '';
            const value = data.datasets[0].data[tooltipItem.index] || 0;
            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  });
},
      
      createBookingStatusChart() {
        if (!this.$refs.bookingStatusChart) {
          console.warn("ไม่เจอ bookingStatusChart canvas!");
          return;
        }
        
        const ctx = this.$refs.bookingStatusChart.getContext('2d');
        
        // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
        if (this.charts.bookingStatusChart) {
          this.charts.bookingStatusChart.destroy();
        }
        
        this.charts.bookingStatusChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['รอดำเนินการ', 'ยืนยันแล้ว', 'ยกเลิกแล้ว'],
            datasets: [{
              data: [
                this.dashboardData.summary.pendingBookings,
                this.dashboardData.summary.confirmedBookings,
                this.dashboardData.summary.cancelledBookings
              ],
              backgroundColor: ['rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(255, 99, 132, 0.7)'],
              borderColor: ['rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      },
      
    createDailyBookingsChart() {
        if (!this.$refs.dailyBookingsChart) {
            console.warn("ไม่เจอ dailyBookingsChart canvas!");
            return;
        }
        
        const ctx = this.$refs.dailyBookingsChart.getContext('2d');
        
        // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
        if (this.charts.dailyBookingsChart) {
            this.charts.dailyBookingsChart.destroy();
        }
        
        const dates = this.dashboardData.bookingsByDate.map(item => this.formatDateDisplay(item.date));
        const counts = this.dashboardData.bookingsByDate.map(item => item.count);
        
        this.charts.dailyBookingsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
            label: 'จำนวนการจอง',
            data: counts,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
            xAxes: [{
                scaleLabel: {
                display: true,
                labelString: 'วันที่'  // เพิ่ม Axis Title ที่แกน x
                }
            }],
            yAxes: [{
                ticks: {
                beginAtZero: true,
                callback: function(value) {
                    if (value % 1 === 0) {
                    return value;
                    }
                }
                },
                scaleLabel: {
                display: true,
                labelString: 'จำนวนการจอง'  // เพิ่ม Axis Title ที่แกน y
                }
            }]
            },
            tooltips: {
            callbacks: {
                label: function(tooltipItem, data) {
                const value = tooltipItem.yLabel;
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `จำนวน: ${value} (${percentage}%)`;
                }
            }
            }
        }
        });
        },
      
        createMonthlyBookingsChart() {
  if (!this.$refs.monthlyBookingsChart) {
    console.warn("ไม่เจอ monthlyBookingsChart canvas!");
    return;
  }
  
  const ctx = this.$refs.monthlyBookingsChart.getContext('2d');
  
  // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
  if (this.charts.monthlyBookingsChart) {
    this.charts.monthlyBookingsChart.destroy();
  }
  
  // ถ้าไม่มีข้อมูล ให้ใช้ข้อมูลตัวอย่าง
  let months = [];
  let counts = [];
  
  if (this.dashboardData.bookingsByMonth.length > 0) {
    months = this.dashboardData.bookingsByMonth.map(item => item.month);
    counts = this.dashboardData.bookingsByMonth.map(item => item.count);
  } else {
    // ข้อมูลตัวอย่าง
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    counts = [5, 8, 12, 15, 10, 7, 9, 11, 13, 7, 4, 6];
  }
  
  this.charts.monthlyBookingsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'จำนวนการจองรายเดือน',
        data: counts,
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'เดือน'  // เพิ่ม Axis Title ที่แกน x
          }
        }],
        yAxes: [{
          ticks: {
            beginAtZero: true,
            callback: function(value) {
              if (value % 1 === 0) {
                return value;
              }
            }
          },
          scaleLabel: {
            display: true,
            labelString: 'จำนวนการจอง'  // เพิ่ม Axis Title ที่แกน y
          }
        }]
      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            const value = tooltipItem.yLabel;
            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `จำนวน: ${value} (${percentage}%)`;
          }
        }
      }
    }
  });
},
      
createLaneUsageChart() {
  if (!this.$refs.laneUsageChart) {
    console.warn("ไม่เจอ laneUsageChart canvas!");
    return;
  }
  
  const ctx = this.$refs.laneUsageChart.getContext('2d');
  
  // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
  if (this.charts.laneUsageChart) {
    this.charts.laneUsageChart.destroy();
  }
  
  // ถ้าไม่มีข้อมูล ให้ใช้ข้อมูลตัวอย่าง
  let lanes = [];
  let counts = [];
  
  if (this.dashboardData.bookingsByLane.length > 0) {
    lanes = this.dashboardData.bookingsByLane.map(item => `ช่องยิง ${item.lane}`);
    counts = this.dashboardData.bookingsByLane.map(item => item.count);
  } else {
    // ข้อมูลตัวอย่าง
    lanes = ['ช่องยิง 101', 'ช่องยิง 102', 'ช่องยิง 103', 'ช่องยิง 104', 'ช่องยิง 105', 'ช่องยิง 106'];
    counts = [25, 18, 30, 22, 15, 10];
  }
  
  this.charts.laneUsageChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: lanes,
      datasets: [{
        data: counts,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        position: 'right'
      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            const dataset = data.datasets[tooltipItem.datasetIndex];
            const value = dataset.data[tooltipItem.index];
            const total = dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${data.labels[tooltipItem.index]}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  });
},
      
      createStaffPerformanceChart() {
        if (!this.$refs.staffPerformanceChart) {
          console.warn("ไม่เจอ staffPerformanceChart canvas!");
          return;
        }
        
        const ctx = this.$refs.staffPerformanceChart.getContext('2d');
        
        // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
        if (this.charts.staffPerformanceChart) {
          this.charts.staffPerformanceChart.destroy();
        }
        
        // ถ้าไม่มีข้อมูล ให้ใช้ข้อมูลตัวอย่าง
        let staffNames = [];
        let confirmedBookings = [];
        let cancelledBookings = [];
        
        if (this.dashboardData.staffPerformance.length > 0) {
          staffNames = this.dashboardData.staffPerformance.map(item => item.name);
          confirmedBookings = this.dashboardData.staffPerformance.map(item => item.confirmedBookings);
          cancelledBookings = this.dashboardData.staffPerformance.map(item => item.cancelledBookings);
        } else {
          // ข้อมูลตัวอย่าง
          staffNames = ['Staff A', 'Staff B', 'Staff C', 'Staff D'];
          confirmedBookings = [28, 15, 32, 20];
          cancelledBookings = [5, 10, 8, 12];
        }
        
        this.charts.staffPerformanceChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: staffNames,
            datasets: [
              {
                label: 'การจองที่ยืนยันแล้ว',
                data: confirmedBookings,
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              },
              {
                label: 'การจองที่ยกเลิกแล้ว',
                data: cancelledBookings,
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                ticks: {
                    beginAtZero: true,
                    callback: function(value) {
                    if (value % 1 === 0) {
                        return value;
                    }
                    }
                }
                }]
            }
          }
        });
      },

      // ฟังก์ชันสร้างกราฟ
      createStaffShiftsChart() {
        console.log('Creating staff shifts chart');
        if (!this.$refs.staffShiftsChart) {
            console.warn("ไม่เจอ staffShiftsChart canvas!");
            return;
        }
        
        const ctx = this.$refs.staffShiftsChart.getContext('2d');
        
        // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
        if (this.charts.staffShiftsChart) {
            this.charts.staffShiftsChart.destroy();
        }
        
        // เตรียมข้อมูล
        let staffNames = [];
        let totalShifts = [];
        
        console.log('Staff shifts data for chart:', this.dashboardData.staffShifts);
        
        // ตรวจสอบข้อมูลอย่างละเอียด
        if (this.dashboardData.staffShifts && Array.isArray(this.dashboardData.staffShifts) && this.dashboardData.staffShifts.length > 0) {
            staffNames = this.dashboardData.staffShifts.map(item => item.name || 'ไม่ระบุชื่อ');
            totalShifts = this.dashboardData.staffShifts.map(item => parseInt(item.totalShifts) || 0);
        } else {
            // ข้อมูลตัวอย่าง
            staffNames = ['Staff A', 'Staff B', 'Staff C', 'Staff D'];
            totalShifts = [12, 8, 15, 6];
            console.log('Using sample data for chart');
        }
        
        try {
            // ใช้ syntax ของ Chart.js เวอร์ชันเก่า
            this.charts.staffShiftsChart = new Chart(ctx, {
            type: 'horizontalBar', // ใช้ horizontalBar สำหรับเวอร์ชันเก่า
            data: {
                labels: staffNames,
                datasets: [
                {
                    label: 'จำนวนการลงชิฟท์',
                    data: totalShifts,
                    backgroundColor: 'rgba(75, 75, 220, 0.7)',
                    borderColor: 'rgba(75, 75, 220, 1)',
                    borderWidth: 1
                }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                    ticks: {
                        beginAtZero: true,
                        callback: function(value) {
                        if (value % 1 === 0) {
                            return value;
                        }
                        }
                    }
                    }]
                }
              }
            });
            console.log('Staff shifts chart created successfully');
        } catch (error) {
            console.error('Error creating staff shifts chart:', error);
            
            // หากยังมีปัญหา ลองใช้ประเภทกราฟที่แน่ใจว่ารองรับ
            try {
            console.log('Trying alternative chart type');
            this.charts.staffShiftsChart = new Chart(ctx, {
                type: 'line', // ใช้ line chart แทน
                data: {
                labels: staffNames,
                datasets: [
                    {
                    label: 'จำนวนการลงชิฟท์',
                    data: totalShifts,
                    backgroundColor: 'rgba(75, 75, 220, 0.7)',
                    borderColor: 'rgba(75, 75, 220, 1)',
                    fill: true,
                    borderWidth: 1
                    }
                ]
                },
                options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                    }]
                }
                }
            });
            console.log('Alternative chart created successfully');
            } catch (altError) {
            console.error('Alternative chart creation also failed:', altError);
            }
        }
        },
        formatCurrentDate() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        return `${day}/${month}/${year}`;
        },
      
      filterByStaff() {
        this.fetchDashboardData();
      },
      
      viewBookingDetails(booking) {
        this.selectedBooking = booking;
        this.showBookingModal = true;
      },
      
      closeModal() {
        this.showBookingModal = false;
      },
      
      formatDateForAPI(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      },
      
      formatDateForInput(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      },
      
      formatDateDisplay(dateString) {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      },
      
      formatDate(dateString) {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      },
      
      getStatusClass(status) {
        switch (status) {
          case 'Pending': return 'status-pending';
          case 'Confirm': return 'status-confirmed';
          case 'Cancel': return 'status-cancelled';
          default: return '';
        }
      }
    },
    mixins: [NotToken],
  };
  </script>
  
  <style scoped>
  .dashboard-container {
    padding: 20px;
    font-family: 'Prompt', sans-serif;
  }
  
  h1 {
    color: #000000;
    font-size: 200%;
    font-weight: bold;
    font-family: Verdana;
    padding-bottom: 3%;
  }
  
  /* ส่วนหัวที่ปรับปรุงใหม่ */
  .header-section {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 15px 20px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .current-date {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-right: 15px;
  }
  
  .date-filter {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .date-filter button {
    padding: 8px 12px;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
  }
  
  .date-filter button.active {
    background-color: #4CAF50;
    color: white;
    border-color: #4CAF50;
  }
  
  /* ส่วนเลือกวันที่แบบกำหนดเอง */
  .custom-date-wrapper {
    margin-bottom: 20px;
    display: flex;
    justify-content: flex-end;
  }
  
  .custom-date-container {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #f9f9f9;
    padding: 12px 15px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    max-width: 600px;
  }
  
  .custom-date-input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 140px;
  }
  
  .submit-btn {
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  /* Loading overlay */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .loading-spinner {
    border: 6px solid #f3f3f3;
    border-top: 6px solid #4CAF50;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Cards */
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
    text-align: center;
    transition: transform 0.3s;
  }
  
  .card2 {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 33px;
    text-align: center;
    transition: transform 0.3s;
  }
  
  .card:hover {
    transform: translateY(-5px);
  }
  
  .card h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    color: #555;
  }
  
  .card-value {
    font-size: 32px;
    font-weight: bold;
    color: #333;
  }
  
  .card.pending {
    border-top: 4px solid #FFB74D;
  }
  
  .card.confirmed {
    border-top: 4px solid #4CAF50;
  }
  
  .card.cancelled {
    border-top: 4px solid #F44336;
  }
  
  /* Charts */
  .chart-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
    height: auto !important;
    min-height: 300px;
    position: relative;
    overflow: hidden;
  }
  
  .chart-card canvas {
    max-width: 100% !important;
    max-height: 250px !important;
  }
  
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 30px;
  }
  
  /* Staff Performance */
  .staff-performance {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 30px;
    height: auto !important;
    min-height: 350px;
    max-height: 500px;
    overflow: hidden;
  }
  
  .staff-performance canvas {
    max-height: 300px !important;
  }
  
  .staff-timesheet {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 30px;
    height: auto !important;
    min-height: 350px;
    max-height: 500px;
    overflow: hidden;
  }
  
  .staff-timesheet canvas {
    max-height: 300px !important;
    max-width: 100% !important;
  }
  
  .staff-filter select {
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    width: 200px;
  }
  
  /* Recent Bookings */
  .recent-bookings {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 30px;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  /* Status Badge */
  .status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    display: inline-block;
    text-align: center;
    font-weight: bold;
  }
  
  .status-pending {
    background-color: #FFF3E0;
    color: #E65100;
  }
  
  .status-confirmed {
    background-color: #E8F5E9;
    color: #2E7D32;
  }
  
  .status-cancelled {
    background-color: #FFEBEE;
    color: #C62828;
  }
  
  /* Action Buttons */
  .action-buttons {
    display: flex;
    gap: 8px;
  }
  
  .btn-view {
    padding: 6px 12px;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn-confirm {
    padding: 6px 12px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn-cancel {
    padding: 6px 12px;
    background-color: #F44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  /* Modal */
  .booking-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 8px;
    width: 500px;
    max-width: 90%;
    padding: 20px;
    position: relative;
  }
  
  .close {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 24px;
    cursor: pointer;
  }
  
  .booking-details {
    margin-top: 20px;
  }
  
  .detail-row {
    display: flex;
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  
  .detail-label {
    font-weight: bold;
    width: 120px;
  }
  
  .status-value {
    font-weight: bold;
  }
  
  .action-buttons-modal {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    gap: 10px;
  }
  
  .canvas {
   width: 100% !important;
   height: 300px !important;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
    
    .header-section {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .current-date {
      margin-bottom: 10px;
    }
    
    .date-filter {
      width: 100%;
      justify-content: space-between;
      margin-top: 5px;
    }
    
    .date-filter button {
      padding: 6px 10px;
      font-size: 13px;
    }
    
    .custom-date-wrapper {
      width: 100%;
    }
    
    .custom-date-container {
      width: 100%;
      flex-wrap: wrap;
    }
    
    .custom-date-input {
      width: 100%;
      margin-bottom: 5px;
    }
  }
  </style>