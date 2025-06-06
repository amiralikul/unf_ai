import { google } from 'googleapis';

class GoogleOAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Scopes for Drive and Gmail access
    this.scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];
  }

  // Generate authorization URL
  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent' // Force consent screen to get refresh token
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  // Set credentials for API calls
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
    return this.oauth2Client;
  }

  // Get user info
  async getUserInfo(tokens) {
    this.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    
    try {
      const { data } = await oauth2.userinfo.get();
      return data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Failed to get user information');
    }
  }

  // Get Drive files
  async getDriveFiles(tokens, pageSize = 50) {
    this.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await drive.files.list({
        pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink, owners, modifiedTime, createdTime)',
        orderBy: 'modifiedTime desc'
      });
      return response.data.files;
    } catch (error) {
      console.error('Error getting Drive files:', error);
      throw new Error('Failed to fetch Drive files');
    }
  }

  // Get Gmail messages
  async getGmailMessages(tokens, maxResults = 50) {
    this.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      // Get list of messages
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox' // Only inbox messages
      });

      if (!listResponse.data.messages) {
        return [];
      }

      // Get detailed info for each message
      const messages = await Promise.all(
        listResponse.data.messages.map(async (msg) => {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date']
          });

          const headers = detail.data.payload.headers;
          const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
          
          // Extract snippet if available
          const snippet = detail.data.snippet || '';
          
          // Check for labels to determine if message is unread or important
          const labels = detail.data.labelIds || [];
          const isUnread = labels.includes('UNREAD');
          const isImportant = labels.includes('IMPORTANT');

          return {
            id: msg.id,
            threadId: msg.threadId,
            subject: getHeader('Subject'),
            sender: getHeader('From'),
            recipient: getHeader('To'),
            date: getHeader('Date'),
            receivedAt: new Date(parseInt(detail.data.internalDate)),
            snippet,
            isUnread,
            isImportant
          };
        })
      );

      return messages;
    } catch (error) {
      console.error('Error getting Gmail messages:', error);
      throw new Error('Failed to fetch Gmail messages');
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }
}

// Create singleton instance
const googleOAuthService = new GoogleOAuthService();

export default googleOAuthService;
