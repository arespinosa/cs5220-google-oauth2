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
const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

// 1️. Create OAuth2 client w/ ENV secrets 
const oauth2Client = new OAuth2Client(
  clientId,
  clientSecret,
  redirectUri
);

// 2. Generate Google auth URL
const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['openid', 'email', 'profile'],
});

// 3. Redirect user to Google login page
app.get('/auth/google', (req, res) => {
  res.redirect(authorizeUrl);
});

// 4. Handle Google callback
app.get('/auth/google/callback', async (req, res) => {
  try {
    const code = req.query.code;

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('Access Token:', tokens.access_token);

    // Optionally fetch the user’s info (email, name, etc.)
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();

    console.log('User Info:', payload);

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
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
