var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
const axios = require('axios');
var jwt = require('jsonwebtoken');

var connection = require('../connection/db.js');

// API สำหรับดึงข้อมูลสต๊าฟตามวันที่เลือก
router.get('/', jsonParser, function(req, res) {
  const { selectedDate } = req.query; // รับวันที่จาก query string

  if (!selectedDate) {
    return res.status(400).json({ error: 'workingDate is required' });
  }

  // ดึงข้อมูลจากฐานข้อมูล
  connection.execute(
    "SELECT username, DATE_FORMAT(workingDate, '%Y-%m-%d') AS workingDate, workingShift FROM WorkSchedule WHERE workingDate = ?",
    [selectedDate],
    (err, rows) => {
      if (err) {
        console.error('Error executing SELECT query:', err);
        return res.status(500).json({ error: 'Database query error' });
      }

      if (rows.length === 0) {
        return res.json({ message: 'No staff working on this date' });
      }

      // ส่งข้อมูลกลับ
      res.json({ staff: rows });
    }
  );
});

module.exports = router;
