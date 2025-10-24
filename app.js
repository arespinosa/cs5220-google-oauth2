import express from 'express';
import {google} from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import 'dotenv/config';

const PORT = 3000;
const app = express();
app.use(express.json());

// Initializing the values for Clientid, ClientSecret from our .env file
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = 'http://localhost:3000/auth/google/callback';

// Creating OAuth2 client w/ ENV secrets 
const oauth2Client = new OAuth2Client(
  clientId,
  clientSecret,
  redirectUri
);

// Generating the Google URL w/ required scope that identifies "resources"
// we want 
const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['openid', 'email', 'profile'],
});

// Creating the GET request to generate the google authorization from our localhost 
app.get('/auth/google', (req, res) => {
  res.redirect(authorizeUrl);
});

// From the Google Callback, we have the redirectURI response 
app.get('/auth/google/callback', async (req, res) => {
  try {
    const code = req.query.code;

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('Access Token:', tokens.access_token);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();

    console.log('User Email:', payload.email);

    res.json({
      email: payload.email,
      access_token: tokens.access_token,
    });
  } catch (err) {
    console.error('Error during authentication:', err);
    res.status(500).send('Authentication failed');
  }
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
