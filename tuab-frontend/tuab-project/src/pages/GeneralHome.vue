<template lang="">
  <div class="container">
    <body>
      <div class="menubar">
        <div class="namebar">
          <h3>{{roleName}}: {{name}}</h3>
        </div>
        <br><br>
        <p Align=center><LogoutBotton /></p>
        <br><br>
        <p Align=center><button class="menu" @click="booking"><span> BOOK NOW </span></button></p><br>
        <p Align=center><button class="menu" @click="cancel"><span> CANCEL BOOKING </span></button></p><br>
        <p Align=center><button class="menu" @click="history"><span> BOOKING HISTORY </span></button></p><br>
      </div>

      <div class="content">
        <br><br><br>
        <h1>Welcome to TU Archery Booking system</h1><br>
        <center>
        <iframe src="https://calendar.google.com/calendar/embed?height=500&wkst=1&ctz=Asia%2FBangkok&showPrint=0&src=Y18xYzgyMzNiMjVlZmRjNWJlMDAzOGI0NWRkZjhkY2ExMDJjY2MzMjY4OTA5NjAyYTcyNTNlZmIwMDhmZTE2NjE5QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=ZW4udGgjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&color=%23039BE5&color=%23D50000"
        width="600" 
        height="500" 
        frameborder="0" 
        scrolling="no">
        </iframe>
        </center>
        <br>
        <h4>1. Book the Archery range, click BOOK NOW</h4><br>
        <h4>2. Cancel your booking, click CANCEL BOOKING</h4><br>
        <h4>3. Recheck your booking history, click BOOKING HISTORY</h4><br>
        <br>
        <center><img src="archery.JPG" width=50% height=30%></center><br>
        <br>
        <h1>Location</h1>
        <br>
        <center><img src="TUABmap.jpeg" width=50% height=30%></center><br>
        <center>
          <a href="https://maps.app.goo.gl/AHKZVHwujk3bU3dj7?g_st=ic"> Google map: TU Archery Range </a>
          <br>
          <label>Opening day: Monday - Thursday</label><br>
          <label>Opening hours: 17.00 - 18.00 pm.</label>
        </center>
        <br><br>
        <h1>Line Official</h1><br>
        <center><img src="lineoa.jpg" width=27% height=27%>
          <br><br>
          <label>Operated by TU Archery club of Thammasat University</label>
        </center>
        <br><br>
      </div>
    </body>
  </div>
</template>
<script>
import LogoutBotton from '../components/LogoutBotton.vue';
import NotToken from '../components/NotToken.vue';
export default {
  components:{
    LogoutBotton
  },
  data() {
    return {
      roleName: '',
      name: '',
    };
  },
  methods: {
    booking() {
      this.$router.replace("booking");
    },
    history() {
      this.$router.replace("history");
    },
    cancel() {
      this.$router.replace("cancel");
    }
  },
  mixins: [NotToken]
}
</script>

<style scoped>
@import '@/assets/css/GeneralHome.css';
</style>