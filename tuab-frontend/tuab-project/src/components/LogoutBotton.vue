<template>
  <button class="logout" @click="logout"><span>LOGOUT</span></button>
</template>

<script>
export default{
  methods: {
    logout() {
      localStorage.removeItem("name");
      localStorage.removeItem("roleName");
      localStorage.removeItem("username");
      localStorage.removeItem("token");
      localStorage.removeItem("endDate");
      this.$router.push('/');
    }
  },
}
</script>

<style scoped>
.logout {
border-radius: 10px;
background-color: #c54638;
font-family: Verdana;
color: #FFFFFF;
text-align: center;
font-size: 100%;
width: 80%;
height: 60px;
transition: all 0.5s;
cursor: pointer;
margin: 5px;
}

.logout span {
cursor: pointer;
display: inline-block;
position: relative;
transition: 0.6s;
}

.logout span:after {
content:"<<";
position: absolute;
opacity: 0;
top: 0;
left: -5%;
transition: 0.6s;
}

.logout:hover span {
padding-left: 10%;
}

.logout:hover span:after {
opacity: 1;
left: 0;
}
</style>