var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
const axios = require('axios');
var jwt = require('jsonwebtoken');

var connection = require('../connection/db.js');

router.get('/', (req, res) => {
    const { start, end } = req.query;
    
    // SQL query เพื่อนับจำนวนชิฟท์ที่แต่ละคนทำงาน
    const query = `
      SELECT w.username, u.name, COUNT(w.workID) as totalShifts
      FROM WorkSchedule w
      JOIN User u ON w.username = u.username
      WHERE w.workingDate BETWEEN ? AND ? AND w.isActive IS NULL
      GROUP BY w.username, u.name
      ORDER BY totalShifts DESC
    `;
    
    connection.query(query, [start, end], function(err, results) {
      if (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch staff shifts data' });
        return;
      }
      res.json(results);
    });
  });

module.exports = router;