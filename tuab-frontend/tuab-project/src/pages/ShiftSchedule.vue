<template lang="">
  <div class="container">
    <body>
      <div class="menubar">
        <div class="namebar">
          <!-- Get Role and Name -->
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
        <h1>Manage Timesheet</h1><br>
        <h2>Please select date first. Then, check/uncheck desired time shifts</h2><br><br>
      
        <!-- Date select -->
        <form align="center">
          <input class="datepicker" type="date" v-model="selectedDate" :min="minDate" :max="maxDate">
        </form>
        <br><br>

        <!-- Shift select -->
        <div class="shiftbox" align="center">
          <input class="box" type="checkbox" id="shift1" name="shift1" value="1" v-model="selectedShifts">
          <label for="shift1">17.00 - 17.30</label><br>
          <input class="box" type="checkbox" id="shift2" name="shift2" value="2" v-model="selectedShifts">
          <label for="shift2">17.30 - 18.00</label><br>
        </div>

        <!-- SAVE button -->
        <center><button class="submit" @click="saveSchedule">SAVE</button></center>
      </div>

      <!-- Accepted PopUP -->
      <div class="popup" id="acceptpopup">
        <img src="paychecked.png" width="30%" height="30%"><br>
        <h7>Shift Operation saved!</h7><br>
        <button @click="closePopup">HOME</button>
      </div>

      <!-- Date Warning PopUP -->
      <div class="popup" id="datewarnpopup">
        <img src="warning.png" width="30%" height="30%"><br>
        <h7>Please specify working date before click "SAVE"</h7><br>
        <button @click="closeDPopup">BACK</button>
      </div>

      <!-- Empty Shift PopUP -->
      <div class="popup" id="emptypopup">
        <a @click="closeEPopup">X</a>
        <img src="warning.png" width=30% height=30%><br>
        <h7>NO any shift was selected</h7><br>
        <h8>Click "SUBMIT" to save your shift as No-working day</h8><br>
        <button type="submit" @click="closePopup">SUBMIT</button>
      </div> 
    </body>
  </div>
</template>

<script>
import axios from 'axios';
import NotToken from '../components/NotToken.vue';
export default {
  data() {
    return {
      roleName: '',
      selectedDate: '', // Selected date
      minDate: '',      // Minimum date
      name: '',
      username: '',
      selectedShifts: [],
      maxDate: ''
    };
  },
  methods: {
    backhome () {
      if(this.roles == '2'){
        this.$router.push('/superStaff-home')
      }
      else if(this.roles == '3'){
        this.$router.push('/staff-home')
      }
    },
    openPopup(){
      document.getElementById('acceptpopup').classList.add('open-popup');
    },
    closePopup(){
      if(this.roles == '2'){
        this.$router.push('/superStaff-home')
      }
      else if(this.roles == '3'){
        this.$router.push('/staff-home')
      }
    },
    closeDPopup(){
      document.getElementById('datewarnpopup').classList.remove('open-popup');
    },
    closeEPopup(){
      document.getElementById('emptypopup').classList.remove('open-popup');
    },
    saveSchedule() {
      if (!this.selectedDate) {
        document.getElementById('datewarnpopup').classList.add('open-popup');
        return;
      }
      const formUD = {
        username: this.username,
        workDate: this.selectedDate
      }
      
      axios.get(`http://localhost:3000/checkWork`, { params: formUD })
      .then(response => {
        const userSchedules = response.data;

        if (userSchedules.length > 0) {
          alert("The date has already been selected.")
        } else {
          if (this.selectedShifts.length === 0) {
            document.getElementById('emptypopup').classList.add('open-popup');
            return;
          }

          const formData = {
            username: this.username,
            workDate: this.selectedDate,
            workShift: this.calculateWorkShift()
          };

          axios.post('http://localhost:3000/workSchedule', formData)
          .then(response => {
            console.log('Shift schedule saved successfully!');
            this.openPopup();
          })
          .catch(error => {
            console.error('Error saving shift schedule:', error);
          });
        }
      })
      .catch(error => {
        console.error('Error fetching user schedules:', error);
      });
    },
    calculateWorkShift() {
      const shift1Selected = this.selectedShifts.includes('1');
      const shift2Selected = this.selectedShifts.includes('2');

      if (shift1Selected && shift2Selected) {
        return '3';
      } else if (shift1Selected) {
        return '1';
      } else if (shift2Selected) {
        return '2';
      } else {
        return '';
      }
    }
  },
  mounted() {      
    // Get today's date
    const today = new Date();

    // Set the minimum date to today
    this.minDate = today.toISOString().split('T')[0];

    // this.fetchOperation();

    this.maxDate = localStorage.getItem("endDate")

  },
  mixins: [NotToken],
}
</script>

<style scoped>
@import '@/assets/css/ShiftSchedule.css';
</style>