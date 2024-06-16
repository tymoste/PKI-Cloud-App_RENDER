const { google } = require('googleapis');
var express = require('express');
const { logging } = require('googleapis/build/src/apis/logging');
var router = express.Router();

const gitClientId = 'Ov23liVDoUk6114fGsAy';
const gitClientSecret = '3b98c6bf5b82dbe0ccef8b991b04222530a99e50';

/* GET home page. */
router.get('/', (req, res) => {
    res.render("glogin", {client_id: gitClientId})
})

module.exports = router;
