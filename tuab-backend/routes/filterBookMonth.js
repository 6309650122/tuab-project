var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
const axios = require('axios');
var jwt = require('jsonwebtoken');

var connection = require('../connection/db.js');

// View a user's booking history by filtering it to show only that month.
router.get('/', jsonParser, function(req, res, next) {
    const { username } = req.query;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
  
    // เพิ่มการดึงข้อมูล cancelTime
    connection.execute(
      "SELECT bookingDate, targetLaneID, shiftID, bookingStatusID, bookingID, cancelTime FROM Booking WHERE username = ? ORDER BY bookingDate DESC, targetLaneID ASC",
      [username],
      (err, rows) => {
        if (err) {
          console.error('Error executing SELECT query:', err);
          return res.status(500).json({ error: 'Database error' });
        }
  
        const filteredRows = rows.filter(row => {
          const bookingDate = new Date(row.bookingDate);
          const rowMonth = bookingDate.getMonth() + 1;
          const rowYear = bookingDate.getFullYear();
  
          return rowMonth === currentMonth && rowYear === currentYear;
        });
  
        const formattedRows = filteredRows.map(row => {
            const dateObject = new Date(row.bookingDate);
            const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
            const formattedDate = dateObject.toLocaleDateString('en-GB', options)
            .split('/')
            .reverse()
            .join('-');
  
            let lane;
            if (row.targetLaneID >= 101 && row.targetLaneID <= 106) {
                lane = row.targetLaneID - 100;
            } else {
                lane = row.targetLaneID; // ให้ใช้ค่าดั้งเดิมถ้าไม่อยู่ในช่วง 101-106
            }
    
            let shift;
            if (row.shiftID === '1') {
                shift = '17:00';
            } else if (row.shiftID === '2') {
                shift = '17:30';
            } else {
                shift = row.shiftID; // ใช้ค่าเดิมถ้าไม่ตรงกับเงื่อนไข
            }
            
            // จัดรูปแบบเวลาที่ยกเลิก
            let formattedCancelTime = null;
            if (row.cancelTime) {
                formattedCancelTime = formatDateTime(row.cancelTime);
            }
    
            return {
                bookingDate: formattedDate,
                targetLaneID: lane,
                shiftID: shift,
                bookingStatusID: row.bookingStatusID,
                bookingID: row.bookingID,
                cancelTime: formattedCancelTime
            };
        });
  
        res.json(formattedRows);
      }
    );
  });
  
  // ฟังก์ชันจัดรูปแบบวันที่และเวลาเป็นเวลาไทย
  function formatDateTime(dateTimeString) {
    const dateTime = new Date(dateTimeString);
    
    // เพิ่มเวลา 7 ชั่วโมงเพื่อให้เป็นเวลาไทย
    // (ถ้าใน MySQL ไม่ได้เก็บเป็น UTC ให้ปรับตามความเหมาะสม)
    dateTime.setHours(dateTime.getHours());
    
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    };
  
    // ใช้ toLocaleString เพื่อจัดรูปแบบวันที่และเวลา
    const formattedDateTime = dateTime.toLocaleString('en-US', options);
    
    // แปลงรูปแบบจาก MM/DD/YYYY, HH:MM เป็น DD/MM/YYYY HH:MM
    const parts = formattedDateTime.split(', ');
    if (parts.length === 2) {
      const dateParts = parts[0].split('/');
      if (dateParts.length === 3) {
        return `${dateParts[1]}/${dateParts[0]}/${dateParts[2]} ${parts[1]}`;
      }
    }
    
    return formattedDateTime;
  }
  
module.exports = router;