# Trello Integration Setup

## Overview
The application integrates with Trello to sync boards and cards. Users need to configure their own Trello API credentials to access their Trello data.

## How to Get Trello API Credentials

### Step 1: Get Your API Key
1. Visit the [Trello Developer API Keys page](https://trello.com/app-key)
2. Log in with your Trello account
3. Copy your API key from the page

### Step 2: Generate a Token
1. After getting your API key, you need to generate a token
2. Replace `YOUR_API_KEY` in the following URL with your actual API key:
   ```
   https://trello.com/1/authorize?expiration=never&scope=read&response_type=token&name=UnframeAI&key=YOUR_API_KEY
   ```
3. Visit this URL in your browser
4. Authorize the application to access your Trello account
5. Copy the token from the resulting page

### Step 3: Configure in the Application
1. Navigate to the Trello section in the application
2. If you haven't configured credentials yet, you'll see a setup form
3. Enter your API key and token
4. Click "Save Trello Credentials"

## Features

Once configured, the application can:
- Sync your Trello boards and cards
- Display cards with status, priority, and due dates
- Link Trello cards to Google Drive files and Gmail messages
- Provide pagination and filtering for large datasets

## Security

- API credentials are stored securely in the database
- Credentials are only used to make read-only requests to Trello
- Each user's credentials are isolated and only accessible to them

## Troubleshooting

### "Trello API credentials not configured" Error
This error occurs when:
1. You haven't set up your Trello credentials yet
2. Your credentials are invalid or expired

**Solution**: Follow the setup steps above to configure valid credentials.

### "Failed to fetch Trello boards" Error
This can happen if:
1. Your API key or token is incorrect
2. Your token has expired
3. Trello API is temporarily unavailable

**Solution**: 
1. Verify your credentials are correct
2. Generate a new token if needed
3. Try again later if it's a temporary API issue

## API Permissions

The application requests the following Trello permissions:
- **Read access**: To fetch your boards, lists, and cards
- **Never expires**: So you don't need to re-authorize frequently

The application does NOT request write permissions, so it cannot modify your Trello data. 