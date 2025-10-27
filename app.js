import 'dotenv/config';              // Load environment variables from .env file
import express from 'express';       // Web framework
import session from 'express-session'; // Session management for keeping users logged in
import {google} from 'googleapis';   // Google APIs client library
import { OAuth2Client } from 'google-auth-library'; // OAuth2 authentication
import path from 'path';             // File path utilities
import {fileURLToPath} from 'url';   // Convert URL to file path (needed for ES modules)

// EXPRESS APP CONFIGURATION
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json()); // Parse JSON request bodies

// ES modules don't have __dirname by default, so we create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SESSION MIDDLEWARE
// Keeps user logged in between requests
app.use(session({
  secret: process.env.SESSION_SECRET || 'SuperSecretKey', // Secret for signing session ID
  resave: false,            // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Set view engine for HTML templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
/*
const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['openid', 'email', 'profile'],
});
*/

// DEFINE ALL API SCOPES
// These are the permissions we're requesting from Google

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',    // User's basic profile
  'https://www.googleapis.com/auth/userinfo.email',      // User's email
  'https://www.googleapis.com/auth/drive.metadata.readonly', // Read Drive file info
  'https://www.googleapis.com/auth/drive.file',          // Create/modify Drive files
  'https://www.googleapis.com/auth/gmail.readonly',      // Read Gmail messages
  'https://www.googleapis.com/auth/gmail.send',          // Send emails
  'https://www.googleapis.com/auth/calendar.readonly',   // Read calendar events
  'https://www.googleapis.com/auth/calendar.events',     // Create/modify calendar events
  'https://www.googleapis.com/auth/spreadsheets.readonly', // Read spreadsheets
  'https://www.googleapis.com/auth/youtube.readonly'     // Read YouTube data
];

// Generate the Google authorization URL with our scopes
const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Get refresh token
  scope: SCOPES,          // Request all permissions
  prompt: 'consent'       // Force consent screen (ensures refresh token)
});


// ROUTES 
// HOME PAGE ROUTE
// Shows landing page with login button
app.get('/', (req, res) => {
  // Render index.ejs and pass user data (or null if not logged in)
  res.render('index', { user: req.session.user || null });
});

// Start OAuth flow - redirect to Google
// Creating the GET request to generate the google authorization from our localhost 
app.get('/auth/google', (req, res) => {
  res.redirect(authorizeUrl);
});

// Google redirects here after user grants permission
// From the Google Callback, we have the redirectURI response 
app.get('/auth/google/callback', async (req, res) => {
  try {
    const code = req.query.code;

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // IMPORTANT: Store tokens in session so we can use them later
    req.session.tokens = tokens;

    // Get user profile information
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Store user info in session
    req.session.user = {
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    };

    console.log('✅ User logged in:', userInfo.data.email);
    
    // Redirect to dashboard instead of showing JSON
    res.redirect('/dashboard');
  } catch (error) {
    console.error('❌ Error during authentication:', error);
    res.redirect('/?error=auth_failed');
  }
});


// STEP 9: DASHBOARD ROUTE
// Shows API testing interface (only if logged in)
app.get('/dashboard', (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.redirect('/'); // Not logged in? Go to home page
  }
  // Render dashboard with user data
  res.render('dashboard', { user: req.session.user });
});


// API ENDPOINTS

// GOOGLE DRIVE API ENDPOINTS
// List user's Drive files
app.get('/api/drive/files', async (req, res) => {
  // Check if user is authenticated
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Set credentials from session
    oauth2Client.setCredentials(req.session.tokens);
    
    // Create Drive API client
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Request list of files
    const response = await drive.files.list({
      pageSize: 10, // Limit to 10 files
      fields: 'files(id, name, mimeType, modifiedTime)'
    });

    console.log('✅ Retrieved', response.data.files?.length || 0, 'Drive files');
    res.json({ files: response.data.files });
  } catch (error) {
    console.error('❌ Drive API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new folder in Drive
app.get('/api/drive/create-folder', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Define folder metadata
    const folderMetadata = {
      name: 'OAuth Test Folder - ' + new Date().toISOString(),
      mimeType: 'application/vnd.google-apps.folder' // This makes it a folder
    };

    // Create the folder
    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id, name, webViewLink' // Return these fields
    });

    console.log('✅ Created Drive folder:', folder.data.name);
    res.json({ folder: folder.data });
  } catch (error) {
    console.error('❌ Drive API Error:', error);
    res.status(500).json({ error: error.message });
  }
});


// GMAIL API ENDPOINTS
// Get recent Gmail messages
app.get('/api/gmail/messages', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get list of message IDs
    const response = await gmail.users.messages.list({
      userId: 'me',      // 'me' = current user
      maxResults: 5      // Get 5 most recent
    });

    const messages = [];
    
    // Fetch details for each message
    if (response.data.messages) {
      for (const message of response.data.messages) {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata', // Only get headers, not full content
          metadataHeaders: ['From', 'Subject', 'Date'] // Which headers to get
        });
        
        // Parse headers into object
        const headers = {};
        msg.data.payload.headers.forEach(header => {
          headers[header.name] = header.value;
        });

        messages.push({
          id: msg.data.id,
          from: headers.From,
          subject: headers.Subject,
          date: headers.Date
        });
      }
    }

    console.log('✅ Retrieved', messages.length, 'Gmail messages');
    res.json({ messages });
  } catch (error) {
    console.error('❌ Gmail API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Gmail labels
app.get('/api/gmail/labels', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.labels.list({ userId: 'me' });

    console.log('✅ Retrieved', response.data.labels?.length || 0, 'Gmail labels');
    res.json({ labels: response.data.labels });
  } catch (error) {
    console.error('❌ Gmail API Error:', error);
    res.status(500).json({ error: error.message });
  }
});


// GOOGLE CALENDAR API ENDPOINTS
// List upcoming calendar events
app.get('/api/calendar/events', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',              // User's primary calendar
      timeMin: new Date().toISOString(),  // Only future events
      maxResults: 10,
      singleEvents: true,                 // Expand recurring events
      orderBy: 'startTime'                // Sort by start time
    });

    console.log('✅ Retrieved', response.data.items?.length || 0, 'calendar events');
    res.json({ events: response.data.items || [] });
  } catch (error) {
    console.error('❌ Calendar API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new calendar event
app.post('/api/calendar/create-event', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Define event details
    const event = {
      summary: 'OAuth Test Event - ' + new Date().toLocaleString(),
      description: 'Event created via Google Calendar API',
      start: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      },
      end: {
        dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // +1 hour
      }
    };

    // Create the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    console.log('✅ Created calendar event:', event.summary);
    res.json({ event: response.data });
  } catch (error) {
    console.error('❌ Calendar API Error:', error);
    res.status(500).json({ error: error.message });
  }
});


// GOOGLE SHEETS API ENDPOINT
// Create a test spreadsheet with data
app.get('/api/sheets/test', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Create new spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: 'OAuth Test Sheet - ' + new Date().toISOString()
        }
      }
    });

    // Add data to the newly created sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: createResponse.data.spreadsheetId,
      range: 'Sheet1!A1:C2',         // Range to write to
      valueInputOption: 'RAW',        // Don't parse values
      resource: {
        values: [
          ['Name', 'Email', 'Date'],  // Header row
          ['Test User', 'test@example.com', new Date().toLocaleDateString()] // Data row
        ]
      }
    });

    console.log('✅ Created spreadsheet:', createResponse.data.spreadsheetUrl);
    res.json({ 
      spreadsheet: {
        id: createResponse.data.spreadsheetId,
        url: createResponse.data.spreadsheetUrl,
        title: createResponse.data.properties.title
      }
    });
  } catch (error) {
    console.error('❌ Sheets API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// YOUTUBE API ENDPOINT
// Get user's YouTube subscriptions
app.get('/api/youtube/subscriptions', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.subscriptions.list({
      part: 'snippet',    // What data to return
      mine: true,         // Get current user's subscriptions
      maxResults: 10
    });

    console.log('✅ Retrieved', response.data.items?.length || 0, 'YouTube subscriptions');
    res.json({ subscriptions: response.data.items || [] });
  } catch (error) {
    console.error('❌ YouTube API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GOOGLE MAPS API ENDPOINT (INFO ONLY)
// Maps API typically uses API key, not OAuth
app.get('/api/maps/geocode', async (req, res) => {
  const address = req.query.address || '1600 Amphitheatre Parkway, Mountain View, CA';
  
  try {
    res.json({ 
      note: 'Maps API requires an API key (not OAuth). Enable it in Google Cloud Console.',
      exampleAddress: address,
      message: 'To use Maps API, you need to enable it separately with an API key'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGOUT ROUTE
// Destroys session and redirects to home
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
    }
  });
  console.log('👋 User logged out');
  res.redirect('/');
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
