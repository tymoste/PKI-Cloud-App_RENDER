const { google } = require('googleapis');
var express = require('express');
const { logging } = require('googleapis/build/src/apis/logging');
const { Client } = require("pg")
const dotenv = require("dotenv")
dotenv.config()
var router = express.Router();

const gitClientId = 'Ov23liVDoUk6114fGsAy';
const gitClientSecret = '3b98c6bf5b82dbe0ccef8b991b04222530a99e50';
    
/* GET home page. */
router.get('/', async (req, res) => {
    if (!req.app.locals.authed) {
        // Generate an OAuth URL and redirect there
        const url = req.app.locals.oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.profile'
        });
        console.log(url);
        res.redirect(url);
    } else {
        const oauth2 = google.oauth2({ version: 'v2', auth: req.app.locals.oAuth2Client });
        oauth2.userinfo.v2.me.get(async function (err, result) {
            if (err) {
                console.log("Error:");
                console.log(err);
                res.send('Error retrieving user info');
            } else {
                const loggedUser = result.data.name;
                console.log(loggedUser);

                const connectDB = async () => {
                    try {
                        const client = new Client({
                            host: PGHOST,
                            database: PGDATABASE,
                            username: PGUSER,
                            password: PGPASSWORD,
                            port: 5432,
                            ssl: 'require',
                            connection: {
                                options: `project=${ENDPOINT_ID}`,
                            }
                        });

                        await client.connect();
                        const result2 = await client.query("SELECT * FROM public.users");
                        await client.end();

                        return result2.rows;
                    } catch (error) {
                        console.log(error);
                        return [];
                    }
                };

                try {
                    const queryResult = await connectDB();
                    res.render("gitloginsuccess", { userData: result.data, queryResult: queryResult });
                } catch (error) {
                    res.send('Error retrieving data');
                }
            }
        });
    }
});

router.get('/auth/google/callback', function (req, res) {
  const code = req.query.code;
  if (code) {
      // Get an access token based on our OAuth code
      req.app.locals.oAuth2Client.getToken(code, function (err, tokens) {
          if (err) {
              console.log('Error authenticating');
              console.log(err);
              res.send('Error during authentication');
          } else {
              console.log('Successfully authenticated');
              req.app.locals.oAuth2Client.setCredentials(tokens);
              req.app.locals.authed = true;
              res.redirect('/glogin');
          }
      });
  }
});

router.get('/logout', (req, res) => {
    req.app.locals.oAuth2Client.revokeCredentials(function (err, result) {
        if (err) {
            console.error('Error revoking credentials:', err);
            res.send('Error during logout');
        } else {
            console.log('Credentials revoked successfully.');
            req.app.locals.authed = false; // Ustawienie authed na false po wylogowaniu
            
            // Wyczyść sesję przeglądarki
            req.session = null;
            
            // Wyślij żądanie do wylogowania się z Google
            res.redirect('/');
        }
    });
});

module.exports = router;
