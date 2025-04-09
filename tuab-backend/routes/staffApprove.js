var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
const axios = require('axios');
require('dotenv').config();
var connection = require('../connection/db.js');

// Staff updates the user's booking status.
router.post('/', jsonParser, function(req, res, next) {
  const { bookId, status, cancelTime, confirmTime } = req.body;

  if (!bookId || !status) {
    return res.status(400).json({ status: 'error', message: 'Missing bookingID or status' });
  }

  // กำหนดค่าพื้นฐานสำหรับ SQL query และ parameters
  let query = "UPDATE Booking SET bookingStatusID = ? WHERE bookingID = ?";
  let params = [status, bookId];

  // กรณีการยกเลิก (status = 3)
  if (parseInt(status) === 3) {
    // ถ้าไม่มี cancelTime ให้ใช้เวลาปัจจุบัน
    const now = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format: YYYY-MM-DD HH:MM:SS
    query = "UPDATE Booking SET bookingStatusID = ?, cancelTime = ? WHERE bookingID = ?";
    params = [status, now, bookId];
  }

  // กรณีการยืนยัน (status = 2)
  if (parseInt(status) === 2) {
    // ใช้เวลาปัจจุบันเป็นเวลายืนยัน
    const now = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format: YYYY-MM-DD HH:MM:SS
    query = "UPDATE Booking SET bookingStatusID = ?, confirmTime = ? WHERE bookingID = ?";
    params = [status, now, bookId];
  }

  connection.execute(
    query,
    params,
    (err, results) => {
      if (err) {
        console.error('Error updating status for booking:', err);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
      }
  
      if (results.affectedRows === 0) {
        return res.status(404).json({ status: 'error', message: 'Booking not found' });
      }
  
      res.json({ status: 'ok', message: 'status updated successfully' });
    }
  );
});

module.exports = router;