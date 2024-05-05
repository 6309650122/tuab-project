var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
const axios = require('axios');
require('dotenv').config();
var connection = require('../connection/db.js');

router.post('/', jsonParser, function(req, res, next) {
  const { start, end } = req.body;

  connection.execute("INSERT INTO OperationDay ( startDate, endDate) VALUES (?, ?)",
      [start, end],
      (err, results) => {
          if (err) {
              console.error('Error inserting operation into database:', err);
              return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
          }
          res.json({ status: 'ok', message: 'successful', operationId: results.insertId });
      });
});

module.exports = router;