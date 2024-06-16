var express = require('express')
var router = express.Router();
const axios = require('axios')

const gitClientId = 'Ov23liVDoUk6114fGsAy';
const gitClientSecret = '3b98c6bf5b82dbe0ccef8b991b04222530a99e50';

router.get('/github/callback', (req, res) => {

    // The req.query object has the query params that were sent to this route.
    const requestToken = req.query.code
    
    axios({
      method: 'post',
      url: `https://github.com/login/oauth/access_token?client_id=${gitClientId}&client_secret=${gitClientSecret}&code=${requestToken}`,
      // Set the content type header, so that we get the response in JSON
      headers: {
           accept: 'application/json'
      }
    }).then((response) => {
      access_token = response.data.access_token
      res.redirect('/gitlogin/success');
    })
  })

  router.get('/success', function(req, res) {

    axios({
      method: 'get',
      url: `https://api.github.com/user`,
      headers: {
        Authorization: 'token ' + access_token
      }
    }).then((response) => {
      res.render('gitloginsuccess',{ userData: response.data });
    })
  });

  module.exports = router;