const { google } = require('googleapis');
const express = require('express');
const { Client } = require("pg");
const dotenv = require("dotenv");
dotenv.config();
const router = express.Router();

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
                            host: process.env.PGHOST,
                            database: process.env.PGDATABASE,
                            user: process.env.PGUSER,
                            password: process.env.PGPASSWORD,
                            port: process.env.PGPORT,
                            ssl: {
                                rejectUnauthorized: false, // tylko w środowisku developmentu
                            }
                        });

                        await client.connect();

                        const now = new Date().toISOString();

                        const userQuery = await client.query('SELECT * FROM users WHERE name = $1', [loggedUser]);
                        if (userQuery.rows.length === 0) {
                            await client.query('INSERT INTO users (name, joined, lastvisit, counter) VALUES ($1, $2, $3, 1)', [loggedUser, now, now]);
                        } else {
                            await client.query('UPDATE users SET lastvisit = $1, counter = counter + 1 WHERE name = $2', [now, loggedUser]);
                        }
                        const result2 = await client.query("SELECT * FROM users"); 
                        await client.end();

                        return result2.rows;
                    } catch (error) {
                        console.error("Error connecting/querying PostgreSQL database:", error);
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
            req.app.locals.authed = false;
            req.session = null;
            res.redirect('/');
        }
    });
});

module.exports = router;
