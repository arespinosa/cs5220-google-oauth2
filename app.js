import express from 'express';
import {google} from 'googleapis';
import 'dotenv/config';

const PORT = 3000;
const app = express();

// 1️. Create OAuth2 client w/ ENV secrets 
const oauth2Client = new google.auth.OAuth2(
    clientId = "CLIENT_ID",
    clientSecret = "YOUR_GOOGLE_CLIENT_SECRET",
    redirectUri = 'http://localhost:3000/redirect',
);

// Step 1: redirect user to Google login page
app.get('/auth/google', (req, res) => {
    const authorizeUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
    });
    res.redirect(authorizeUrl);
  });
  
  // Step 2: Google redirects back with ?code=...
  app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    const { tokens } = await client.getToken(code); // exchange code for tokens
    res.json(tokens); // You can inspect the access_token and id_token here
  });
  
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));