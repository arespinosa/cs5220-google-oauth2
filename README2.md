# 🚀 Google OAuth2 Multi-API Integration

A comprehensive Node.js application demonstrating Google OAuth2 authentication with integration of multiple Google APIs including Drive, Gmail, Calendar, Sheets, and YouTube.

## 📋 Features

- ✅ **Google OAuth2 Authentication** - Secure user login
- 📁 **Google Drive API** - List files, create folders
- 📧 **Gmail API** - Read messages, list labels
- 📅 **Google Calendar API** - View events, create events
- 📊 **Google Sheets API** - Create spreadsheets
- 📺 **YouTube API** - Access subscriptions

## 🛠️ Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Google Account
- Google Cloud Project with OAuth2 credentials

## 📦 Installation

### Step 1: Clone or Download the Project

```bash
# If you have the files, navigate to the project directory
cd google-oauth-expansion

# Install dependencies
npm install
```

### Step 2: Set Up Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create a New Project** (or use existing):
   - Click on the project dropdown at the top
   - Click "NEW PROJECT"
   - Name it "OAuth Multi-API Demo"
   - Click "CREATE"

3. **Enable APIs**:
   - Go to "APIs & Services" > "Library"
   - Search and enable the following APIs:
     - ✅ Google Drive API
     - ✅ Gmail API
     - ✅ Google Calendar API
     - ✅ Google Sheets API
     - ✅ YouTube Data API v3
     - ✅ Google+ API (for user profile)

4. **Create OAuth2 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "+ CREATE CREDENTIALS" > "OAuth client ID"
   - If prompted, configure OAuth consent screen:
     - User Type: "External"
     - App name: "OAuth Multi-API Demo"
     - User support email: Your email
     - Developer contact: Your email
     - Scopes: Add the following scopes:
       - `.../auth/userinfo.email`
       - `.../auth/userinfo.profile`
       - `.../auth/drive.metadata.readonly`
       - `.../auth/drive.file`
       - `.../auth/gmail.readonly`
       - `.../auth/calendar.readonly`
       - `.../auth/calendar.events`
       - `.../auth/spreadsheets`
       - `.../auth/youtube.readonly`
     - Test users: Add your Google account email
   - Go back to Credentials > "+ CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "OAuth Web Client"
   - Authorized redirect URIs:
     - Add: `http://localhost:3000/auth/google/callback`
   - Click "CREATE"
   - **SAVE** the Client ID and Client Secret!

### Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file with your credentials:
```env
CLIENT_ID=your_client_id_here.apps.googleusercontent.com
CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://localhost:3000/auth/google/callback
SESSION_SECRET=any_random_string_here
PORT=3000
```

### Step 4: Run the Application

```bash
npm start
```

You should see:
```
✅ Server running on http://localhost:3000

📝 Setup Instructions:
1. Copy .env.example to .env
2. Add your Google OAuth credentials to .env
3. Visit http://localhost:3000 to start
```

## 🧪 Testing the Application

### Step-by-Step Testing Guide

#### 1. **Test Authentication**
1. Open browser: http://localhost:3000
2. Click "Sign in with Google"
3. Choose your Google account
4. Review and accept permissions
5. You should be redirected to the Dashboard

#### 2. **Test Google Drive API**
On the Dashboard:
- Click "List Files" - Should show your recent Drive files
- Click "Create Folder" - Creates a test folder in your Drive
- ✅ **Proof**: Check your Google Drive for the new folder

#### 3. **Test Gmail API**
On the Dashboard:
- Click "Get Messages" - Shows your recent emails
- Click "Get Labels" - Lists all your Gmail labels (Inbox, Sent, etc.)
- ✅ **Proof**: Compare with your actual Gmail

#### 4. **Test Calendar API**
On the Dashboard:
- Click "List Events" - Shows upcoming calendar events
- Click "Create Event" - Creates a test event for tomorrow
- ✅ **Proof**: Check your Google Calendar for the new event

#### 5. **Test Google Sheets API**
On the Dashboard:
- Click "Create Test Sheet" - Creates a new spreadsheet
- Response includes a direct link to the sheet
- ✅ **Proof**: Open the URL to see your new spreadsheet

#### 6. **Test YouTube API**
On the Dashboard:
- Click "Get Subscriptions" - Lists channels you're subscribed to
- ✅ **Proof**: Compare with your YouTube subscriptions

## 📸 Expected Results

When clicking any API button, you should see:
- ✅ Success message in green
- JSON response data showing the results
- For creation operations (folder, event, sheet), you'll get links/IDs

### Example Successful Response:
```json
{
  "files": [
    {
      "id": "1abc...",
      "name": "My Document",
      "mimeType": "application/vnd.google-apps.document"
    }
  ]
}
```

## 🔧 Troubleshooting

### Error: "Access blocked: Authorization Error"
**Solution**: 
- Make sure all required APIs are enabled in Google Cloud Console
- Add your email as a test user in OAuth consent screen
- Ensure the app is not in production mode (keep it in testing mode)

### Error: "Redirect URI mismatch"
**Solution**:
- Check that `http://localhost:3000/auth/google/callback` is added to authorized redirect URIs
- Ensure the URL in your .env matches exactly

### Error: "Invalid authentication"
**Solution**:
- Double-check CLIENT_ID and CLIENT_SECRET in .env
- Make sure there are no extra spaces or quotes
- Try re-creating the OAuth client

### No data returned from APIs
**Solution**:
- Some APIs require data to exist (e.g., YouTube subscriptions)
- Gmail needs emails in your inbox
- Calendar will only show future events

## 🎓 Learning Objectives

After completing this project, you will understand:

1. ✅ OAuth2 authentication flow
2. ✅ How to request and use access tokens
3. ✅ Working with multiple Google APIs
4. ✅ Handling API scopes and permissions
5. ✅ Session management in Express
6. ✅ Making authenticated API requests
7. ✅ Error handling for API calls

## 📁 Project Structure

```
google-oauth-expansion/
├── app.js                 # Main application file
├── package.json           # Dependencies
├── .env                   # Environment variables (create this)
├── .env.example          # Environment template
├── views/
│   ├── index.ejs         # Home page
│   └── dashboard.ejs     # API testing dashboard
└── README.md             # This file
```

## 🔐 Security Notes

- Never commit `.env` file to version control
- Keep your CLIENT_SECRET private
- Use HTTPS in production
- Implement proper error handling
- Store tokens securely (use database in production)
- Regularly rotate secrets

## 🚀 Next Steps / Enhancements

1. **Add more APIs**:
   - Google Photos API
   - Google Contacts (People API)
   - Google Tasks API

2. **Improve functionality**:
   - File upload to Drive
   - Send emails through Gmail
   - Search functionality for each API

3. **Better UI**:
   - Add pagination for results
   - Better error messages
   - Loading states

4. **Production ready**:
   - Add database for token storage
   - Implement refresh token logic
   - Add rate limiting
   - Use HTTPS

## 📚 API Documentation

- [Google OAuth2](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API](https://developers.google.com/drive/api/v3/about-sdk)
- [Gmail API](https://developers.google.com/gmail/api/guides)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [Google Sheets API](https://developers.google.com/sheets/api/guides/concepts)
- [YouTube Data API](https://developers.google.com/youtube/v3/getting-started)

## 🤝 Contributing

Feel free to fork this project and add more features!

## 📄 License

MIT License - Feel free to use this for learning and projects

## 💡 Tips for Testing

1. **Use a Test Google Account**: Don't use your primary account
2. **Check Console Logs**: Server logs show detailed error messages
3. **Browser DevTools**: Check Network tab for API responses
4. **Test Incrementally**: Test one API at a time
5. **Refresh Tokens**: If tokens expire, just re-authenticate

---


**Created for CS5220 - Demonstrating Google OAuth2 with Multiple API Integrations**

Questions? Check the troubleshooting section or enable additional APIs in Google Cloud Console.
