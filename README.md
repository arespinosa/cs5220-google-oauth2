Pre-Steps
1. Go to this page --> Go to the https://console.cloud.google.com/auth/clients
2. Click the + icon to create a new Client 
3. Select Web Application for the Application Type
4. Create a name for the new client 
5. Add an authorized redirect URI
6. Store the clientID as CLIENT_ID and clientSecret as CLIENT_SECRET in your .env file 

Steps to run the GitHub Authorization Example

1. Cd into the directory that contains app.js
2.  Run npm app.js and wait until you see Server running at http://localhost
3. Go into the URL: http://localhost:{PORTNUMBER}/auth/google
4. Sign in to the Google Account your registered your client ID in 
5. You should see the access token and email on the browser and userInfo on the terminal 