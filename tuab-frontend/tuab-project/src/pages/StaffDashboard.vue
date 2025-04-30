<template>
    <div class="dashboard-container">
      <div class="header">
        <h1>ระบบจัดการการจอง (SuperStaff)</h1>
        <div class="date-filter">
          <button :class="{ active: dateRange === 'today' }" @click="setDateRange('today')">วันนี้</button>
          <button :class="{ active: dateRange === 'week' }" @click="setDateRange('week')">สัปดาห์นี้</button>
          <button :class="{ active: dateRange === 'month' }" @click="setDateRange('month')">เดือนนี้</button>
          <button :class="{ active: dateRange === '3months' }" @click="setDateRange('3months')">3 เดือน</button>
          <button :class="{ active: dateRange === 'custom' }" @click="setDateRange('custom')">กำหนดเอง</button>
          <div v-if="dateRange === 'custom'" class="custom-date-range">
            <input type="date" v-model="startDate" />
            <span>ถึง</span>
            <input type="date" v-model="endDate" />
            <button @click="applyCustomRange">ตกลง</button>
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
          <div class="chart-card">
            <h2>สถานะการจอง</h2>
            <canvas ref="bookingStatusChart" style="height: 300px; width: 100%;"></canvas>
          </div>
          
          <div class="chart-card">
            <h2>การจองรายวัน</h2>
            <canvas ref="dailyBookingsChart"  style="height: 300px; width: 100%;"></canvas>
          </div>
          
          <div class="chart-card">
            <h2>การจองรายเดือน</h2>
            <canvas ref="monthlyBookingsChart"  style="height: 300px; width: 100%;"></canvas>
          </div>
          
          <div class="chart-card">
            <h2>การใช้งานแต่ละเลน</h2>
            <canvas ref="laneUsageChart"  style="height: 300px; width: 100%;"></canvas>
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
  
        <div class="recent-bookings">
          <h2>การจองล่าสุดทั้งหมด</h2>
          <div class="table-container">
            <vue-good-table
              :columns="bookingColumns"
              :rows="dashboardData.recentBookings"
              :pagination-options="{
                enabled: true,
                perPage: 10
              }"
              :search-options="{
                enabled: true,
                placeholder: 'ค้นหาการจอง...'
              }"
            >
              <template v-slot:table-row="props">
                <div v-if="props.column.field === 'status'" :class="'status-badge ' + getStatusClass(props.row.status)">
                  {{ props.row.status }}
                </div>
                <div v-else-if="props.column.field === 'actions'" class="action-buttons">
                  <button class="btn-view" @click="viewBookingDetails(props.row)">ดูรายละเอียด</button>
                </div>
                <div v-else>
                  {{ props.formattedRow[props.column.field] }}
                </div>
              </template>
            </vue-good-table>
          </div>
        </div>
      </div>
  
      <!-- โมดัลแสดงรายละเอียดการจอง -->
      <div v-if="showBookingModal" class="booking-modal">
        <div class="modal-content">
          <span class="close" @click="closeModal">&times;</span>
          <h2>รายละเอียดการจอง #{{ selectedBooking.id }}</h2>
          <div class="booking-details">
            <div class="detail-row">
              <div class="detail-label">ชื่อผู้จอง:</div>
              <div class="detail-value">{{ selectedBooking.userName }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">เลขประจำตัว:</div>
              <div class="detail-value">{{ selectedBooking.username }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">เลน:</div>
              <div class="detail-value">{{ selectedBooking.lane }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">วันที่:</div>
              <div class="detail-value">{{ formatDate(selectedBooking.date) }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">เวลา:</div>
              <div class="detail-value">{{ selectedBooking.time }}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">สถานะ:</div>
              <div class="detail-value" :class="'status-value ' + getStatusClass(selectedBooking.status)">
                {{ selectedBooking.status }}
              </div>
            </div>
          </div>
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
          recentBookings: []
        },
        
        staffList: [],
        
        // กราฟสำหรับ Chart.js
        charts: {
          bookingStatusChart: null,
          dailyBookingsChart: null,
          monthlyBookingsChart: null,
          laneUsageChart: null,
          staffPerformanceChart: null,
          bookingStatusStackedChart: null,
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
        await this.fetchDashboardData();
      } catch (error) {
        console.error("Error loading data:", error);
      }
    },
    
    methods: {

        createShiftBookingsChart() {
  if (!this.$refs.dailyBookingsChart) {
    console.warn("ไม่เจอ dailyBookingsChart canvas!");
    return;
  }
  
  const ctx = this.$refs.dailyBookingsChart.getContext('2d');
  
  // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
  if (this.charts.dailyBookingsChart) {
    this.charts.dailyBookingsChart.destroy();
  }
  
  // สร้างหรือใช้ข้อมูลตัวอย่าง
  let shifts = [];
  let counts = [];
  
  if (this.dashboardData.bookingsByShift && this.dashboardData.bookingsByShift.length > 0) {
    shifts = this.dashboardData.bookingsByShift.map(item => item.shift);
    counts = this.dashboardData.bookingsByShift.map(item => item.count);
  } else {
    // ข้อมูลตัวอย่าง
    shifts = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'];
    counts = [3, 5, 8, 6, 4, 2];
  }
  
  this.charts.dailyBookingsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: shifts,
      datasets: [{
        label: 'จำนวนการจองตาม Shift',
        data: counts,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
},

createBookingStatusStackedChart() {
  console.log('StackBarChart for booking status is being created');
  
  // ตรวจสอบว่ามี canvas หรือไม่
  if (!this.$refs.bookingStatusStackedChart) {  // แก้ไขตรงนี้
    console.warn("ไม่เจอ bookingStatusStackedChart canvas!");
    return;
  }
  
  const ctx = this.$refs.bookingStatusStackedChart.getContext('2d');  // แก้ไขตรงนี้
  
  // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
  if (this.charts.bookingStatusStackedChart) {  // แก้ไขตรงนี้
    this.charts.bookingStatusStackedChart.destroy();
  }
  
  // สร้างข้อมูลตัวอย่างกรณีไม่มีข้อมูล
  let labels = [];
  let pendingData = [];
  let confirmedData = [];
  let cancelledData = [];
  
  // หากไม่มีข้อมูลจริง ให้ใช้ข้อมูลตัวอย่าง
  if (!this.dashboardData.bookingStatusByDate || this.dashboardData.bookingStatusByDate.length === 0) {
    labels = ['วันที่ 1', 'วันที่ 2', 'วันที่ 3', 'วันที่ 4', 'วันที่ 5'];
    pendingData = [3, 5, 2, 1, 4];
    confirmedData = [7, 4, 6, 8, 5];
    cancelledData = [2, 1, 3, 2, 1];
    
    console.log('No real data available. Using sample data for StackBarChart.');
  } else {
    // ใช้ข้อมูลจริง
    if (['week', 'month', 'custom'].includes(this.dateRange) && 
        (!this.customDateRangeDuration || this.customDateRangeDuration < 32)) {
      labels = this.dashboardData.bookingStatusByDate.map(item => this.formatDateDisplay(item.date));
      pendingData = this.dashboardData.bookingStatusByDate.map(item => item.pendingCount || 0);
      confirmedData = this.dashboardData.bookingStatusByDate.map(item => item.confirmedCount || 0);
      cancelledData = this.dashboardData.bookingStatusByDate.map(item => item.cancelledCount || 0);
    } else if (this.dateRange === '3months' || 
                (this.dateRange === 'custom' && this.customDateRangeDuration >= 32)) {
      labels = this.dashboardData.bookingStatusByMonth.map(item => item.month);
      pendingData = this.dashboardData.bookingStatusByMonth.map(item => item.pendingCount || 0);
      confirmedData = this.dashboardData.bookingStatusByMonth.map(item => item.confirmedCount || 0);
      cancelledData = this.dashboardData.bookingStatusByMonth.map(item => item.cancelledCount || 0);
    }
  }
  
  console.log('StackBarChart data:', { labels, pendingData, confirmedData, cancelledData });
  
  // สร้าง Stacked Bar Chart
  this.charts.bookingStatusStackedChart = new Chart(ctx, {  // แก้ไขตรงนี้
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'รอดำเนินการ',
          data: pendingData,
          backgroundColor: 'rgba(255, 206, 86, 0.7)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1
        },
        {
          label: 'ยืนยันแล้ว',
          data: confirmedData,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'ยกเลิกแล้ว',
          data: cancelledData,
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
        // แก้ไขจาก Chart.js v3 เป็น v2
        xAxes: [{
          stacked: true,
          scaleLabel: {
            display: true,
            labelString: this.dateRange === '3months' || 
                          (this.dateRange === 'custom' && this.customDateRangeDuration >= 32) 
                          ? 'เดือน' : 'วันที่'
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
      // แก้ไขจาก plugins.legend เป็น legend
      legend: {
        position: 'top'
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
  
  console.log('StackBarChart created successfully');
},


        calculateCustomDateRange() {
            if (this.dateRange !== 'custom') {
                return;
            }
            
            const start = new Date(this.startDate);
            const end = new Date(this.endDate);
            
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                // คำนวณจำนวนวันระหว่างวันที่เริ่มต้นและวันที่สิ้นสุด
                const diffTime = Math.abs(end - start);
                this.customDateRangeDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 เพื่อรวมวันสุดท้าย
            } else {
                this.customDateRangeDuration = 0;
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
  // ถ้ามีการทำอะไรพิเศษกับกราฟในฟังก์ชันนี้ ให้แน่ใจว่าใช้ Pie Chart
  this.fetchDashboardData();
},
      
      applyCustomRange() {
        // ตรวจสอบว่ามีการระบุวันที่ครบถ้วนหรือไม่
        if (!this.startDate || !this.endDate) {
          alert('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด');
          return;
        }
        
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
          
          // 2. ดึงข้อมูลการจองตามวันที่
          const bookingsByDateResponse = await axios.get('http://localhost:3000/dashboard/bookings-by-date', {
            params: {
              staff: this.selectedStaff || undefined,
              start,
              end
            }
          });
          this.dashboardData.bookingsByDate = bookingsByDateResponse.data;
          
          // 3. ดึงข้อมูลการจองตามเดือน
          const bookingsByMonthResponse = await axios.get('http://localhost:3000/dashboard/bookings-by-month', {
            params: {
              year: new Date().getFullYear(),
              staff: this.selectedStaff || undefined
            }
          });
          this.dashboardData.bookingsByMonth = bookingsByMonthResponse.data;
          
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
          
          // 6. ดึงข้อมูลการจองล่าสุด
          const recentBookingsResponse = await axios.get('http://localhost:3000/dashboard/recent-bookings', {
            params: {
              staff: this.selectedStaff || undefined,
              limit: 20
            }
          });
          this.dashboardData.recentBookings = recentBookingsResponse.data;
          
         // 7. คำนวณ customDateRangeDuration (ถ้าเป็นฟิลเตอร์ custom)
    if (this.dateRange === 'custom') {
      this.calculateCustomDateRange();
    }
    
    // 8. ถ้าเป็นฟิลเตอร์ "วันนี้" ให้ดึงข้อมูลการจองตาม shift
    if (this.dateRange === 'today') {
      try {
        // ถ้าต้องการสร้าง API ใหม่:
        const bookingsByShiftResponse = await axios.get('http://localhost:3000/dashboard/bookings-by-shift', {
          params: {
            date: start
          }
        });
        this.dashboardData.bookingsByShift = bookingsByShiftResponse.data;
      } catch (shiftError) {
        console.error('Error fetching shift data:', shiftError);
        // กรณี API ไม่มี ให้สร้างข้อมูลจำลอง
        this.dashboardData.bookingsByShift = [
          { shift: '17:00-17:30', count: 0 },
          { shift: '17:30-18:00', count: 0 }
        ];
      }
    }
    
    // 9. ดึงข้อมูลสถานะการจองตามวันที่หรือเดือน
    try {
      if (['week', 'month', 'custom'].includes(this.dateRange) && 
          (!this.customDateRangeDuration || this.customDateRangeDuration < 32)) {
        // ดึงข้อมูลสถานะการจองรายวัน
        const bookingStatusByDateResponse = await axios.get('http://localhost:3000/dashboard/booking-status-by-date', {
          params: {
            start,
            end
          }
        });
        this.dashboardData.bookingStatusByDate = bookingStatusByDateResponse.data;
      } else if (this.dateRange === '3months' || 
                (this.dateRange === 'custom' && this.customDateRangeDuration >= 32)) {
        // ดึงข้อมูลสถานะการจองรายเดือน
        const bookingStatusByMonthResponse = await axios.get('http://localhost:3000/dashboard/booking-status-by-month', {
          params: {
            year: new Date().getFullYear()
          }
        });
        this.dashboardData.bookingStatusByMonth = bookingStatusByMonthResponse.data;
      }
    } catch (statusError) {
      console.error('Error fetching booking status data:', statusError);
    }
    
    // 10. ดึงข้อมูลการจองแยกตามคณะ (หรือข้อมูลการจองทั้งหมด)
    try {
      const allBookingsResponse = await axios.get('http://localhost:3000/dashboard/recent-bookings', {
        params: {
          start,
          end,
          limit: 1000 // ดึงข้อมูลมากขึ้นเพื่อนำมาวิเคราะห์
        }
      });
      this.dashboardData.allBookings = allBookingsResponse.data;
    } catch (facultyError) {
      console.error('Error fetching faculty data:', facultyError);
    }
    // จบส่วนที่เพิ่ม ↑↑↑
  
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    alert('เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง');
  } finally {
    this.loading = false;
    
    this.$nextTick(() => {
      setTimeout(() => {
        // สร้างกราฟตามฟิลเตอร์ที่เลือก
        if (this.dateRange === 'today') {
          // สำหรับฟิลเตอร์ "วันนี้" ใช้ Pie Chart
          this.createBookingStatusPieChart();
          this.createShiftBookingsChart();
        } else {
          // สำหรับฟิลเตอร์อื่นๆ ใช้ Stacked Bar Chart
          this.createBookingStatusStackedChart();
          
          if (['week', 'month', 'custom'].includes(this.dateRange) && 
              (!this.customDateRangeDuration || this.customDateRangeDuration < 32)) {
            this.createDailyBookingsChart();
          } else if (this.dateRange === '3months' || 
                    (this.dateRange === 'custom' && this.customDateRangeDuration >= 32)) {
            this.createMonthlyBookingsChart();
          }
        }
        
        // สร้างกราฟที่แสดงในทุกฟิลเตอร์
        this.createLaneUsageChart();
        this.createStaffPerformanceChart();
      }, 100);
    });
        }
      },

      createBookingStatusPieChart() {
  if (!this.$refs.bookingStatusStackedChart) {
    console.warn("ไม่เจอ bookingStatusStackedChart canvas!");
    return;
  }
  
  const ctx = this.$refs.bookingStatusStackedChart.getContext('2d');
  
  // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
  if (this.charts.bookingStatusChart) {
    this.charts.bookingStatusChart.destroy();
  }
  
  // กำหนดข้อมูลสำหรับ Pie Chart
  const data = {
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
  };
  
  // สร้าง Pie Chart
  this.charts.bookingStatusChart = new Chart(ctx, {
    type: 'pie',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: false // ไม่แสดง title เพราะมี h2 ใน HTML อยู่แล้ว
        }
      }
    }
  });
  
  // ล็อกข้อมูลเพื่อตรวจสอบ
  console.log("สร้าง Pie Chart สำหรับสถานะการจอง:", {
    pending: this.dashboardData.summary.pendingBookings,
    confirmed: this.dashboardData.summary.confirmedBookings,
    cancelled: this.dashboardData.summary.cancelledBookings
  });
},

createShiftBookingsChart() {
  if (!this.$refs.dailyBookingsChart) {
    console.warn("ไม่เจอ dailyBookingsChart canvas!");
    return;
  }
  
  const ctx = this.$refs.dailyBookingsChart.getContext('2d');
  
  // ตรวจสอบว่ากราฟเดิมมีอยู่หรือไม่ ถ้ามีให้ทำลายก่อน
  if (this.charts.dailyBookingsChart) {
    this.charts.dailyBookingsChart.destroy();
  }
  
  // สร้างหรือใช้ข้อมูลตัวอย่าง
  let shifts = [];
  let counts = [];
  
  if (this.dashboardData.bookingsByShift && this.dashboardData.bookingsByShift.length > 0) {
    shifts = this.dashboardData.bookingsByShift.map(item => item.shift);
    counts = this.dashboardData.bookingsByShift.map(item => item.count);
  } else {
    // ข้อมูลตัวอย่าง
    shifts = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'];
    counts = [3, 5, 8, 6, 4, 2];
  }
  
  this.charts.dailyBookingsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: shifts,
      datasets: [{
        label: 'จำนวนการจองตาม Shift',
        data: counts,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'การจองตาม Shift'
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
          type: 'line',
          data: {
            labels: dates,
            datasets: [{
              label: 'จำนวนการจอง',
              data: counts,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
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
              backgroundColor: 'rgba(153, 102, 255, 0.5)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
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
          lanes = this.dashboardData.bookingsByLane.map(item => `เลน ${item.lane}`);
          counts = this.dashboardData.bookingsByLane.map(item => item.count);
        } else {
          // ข้อมูลตัวอย่าง
          lanes = ['เลน 101', 'เลน 102', 'เลน 103', 'เลน 104', 'เลน 105', 'เลน 106'];
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
            plugins: {
              legend: {
                position: 'right'
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
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
              }
            }
          }
        });
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
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .date-filter {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .date-filter button {
    padding: 8px 16px;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .date-filter button.active {
    background-color: #4CAF50;
    color: white;
    border-color: #4CAF50;
  }
  
  .custom-date-range {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 10px;
  }
  
  .custom-date-range input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
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
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
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
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 30px;
  }

  .chart-card canvas {
  width: 100% !important;
  height: 300px !important;
}
  
  .chart-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
    height: 300px;
  }
  
  /* Staff Performance */
  .staff-performance {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 30px;
    height: 400px;
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
  
  @media (max-width: 768px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
    
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .date-filter {
      margin-top: 10px;
      flex-wrap: wrap;
    }
  }
  </style> 