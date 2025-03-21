var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
const axios = require('axios');
require('dotenv').config();
var connection = require('../connection/db.js');

// Edit and update the opening and closing times of the archery field.
router.post('/', jsonParser, function(req, res, next) {
  const { opID, Nstart, Nend } = req.body;
  // ตรวจสอบว่า opID, Nstart, และ Nend มีค่า และ Nstart กับ Nend ต้องไม่เป็นวันเดียวกัน
  if (!opID || !Nstart || !Nend || Nstart === Nend) {
    return res.status(400).json({ status: 'error', message: 'Missing operationID or startDate or endDate or startDate is the same day with endDate' });
  }

  connection.execute(
    "INSERT INTO operationDay (startDate, endDate) VALUES (?, ?)",
    [Nstart, Nend],
    (err, results) => {
      if (err) {
        console.error('Error updating status for user:', err);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
      }
  
      if (results.insertId) {
        res.json({ status: 'ok', message: 'Operation added successfully', operationID: results.insertId });
      } else {
        res.status(400).json({ status: 'error', message: 'Failed to add operation' });
      }
    }
  );

});

module.exports = router;