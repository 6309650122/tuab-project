const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // ดึงข้อมูลวันหยุดจาก PublicHolidays API
    const response = await axios.get(
      `https://holidayapi.com/v1/holidays?pretty&key=ad923a56-70d3-42c8-af7a-800020f1259d&country=TH&year=2024`
    );

    // ตรวจสอบว่า API ส่งข้อมูลวันหยุดได้ถูกต้องหรือไม่
    if (response.data && response.data.holidays) {
      const holidays = response.data.holidays.filter(holiday => holiday.public); // เฉพาะวันหยุดที่ public: true
      res.json({ holidays });
    } else {
      res.status(500).json({ error: 'No holidays data found' });
    }
  } catch (error) {
    console.error('Error fetching holidays:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch holidays', details: error.message });
  }
});

module.exports = router;
