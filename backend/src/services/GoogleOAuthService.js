import { google } from 'googleapis';
import addressparser from 'addressparser';

export class GoogleOAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Scopes for Drive, Gmail, and Google Docs access
    this.scopes = [
      'https://www.googleapis.com/auth/drive',              // Full Drive access (read/write)
      'https://mail.google.com/',                           // Full Gmail access (required for delete operations)
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/presentations.readonly',
      'openid',
      'email',
      'profile'
    ];
  }

  // Generate authorization URL
  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent select_account', // Force consent screen and account selection
      include_granted_scopes: true
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

  // Helper method to determine file type based on MIME type
  _getFileType(mimeType) {
    const typeMap = {
      'application/vnd.google-apps.document': 'docs',
      'application/vnd.google-apps.spreadsheet': 'sheets',
      'application/vnd.google-apps.presentation': 'slides',
      'application/vnd.google-apps.form': 'forms',
      'application/vnd.google-apps.folder': 'folder'
    };
    
    return typeMap[mimeType] || 'drive';
  }

  // Get Drive files with enhanced metadata
  async getDriveFiles(tokens, pageSize = 50) {
    this.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await drive.files.list({
        pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink, owners, modifiedTime, createdTime, shared, permissions)',
        orderBy: 'modifiedTime desc'
      });
      
      // Enhance files with additional metadata
      const enhancedFiles = response.data.files.map(file => ({
        ...file,
        fileType: this._getFileType(file.mimeType),
        isShared: file.shared || (file.permissions && file.permissions.length > 1),
        docsUrl: file.webViewLink // Store the original Google Docs URL
      }));
      
      return enhancedFiles;
    } catch (error) {
      console.error('Error getting Drive files:', error);
      throw new Error('Failed to fetch Drive files');
    }
  }

  // Helper function to parse email strings
  _parseEmailString(emailString) {
    if (!emailString) {
      return { name: '', email: '' };
    }
    
    const parsed = addressparser(emailString);
    
    if (parsed && parsed.length > 0) {
      // Return the first parsed address. The library returns 'address' for the email part.
      return { name: parsed[0].name, email: parsed[0].address };
    }
    
    // Fallback for any unexpected cases
    return { name: '', email: emailString };
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
            format: 'full', // Change to 'full' to get attachments
          });

          const headers = detail.data.payload.headers;
          const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
          
          // Extract snippet if available
          const snippet = detail.data.snippet || '';
          
          // Check for labels to determine if message is unread or important
          const labels = detail.data.labelIds || [];
          const isUnread = labels.includes('UNREAD');
          const isImportant = labels.includes('IMPORTANT');

          // Extract Drive attachments and Google Docs links
          const attachments = [];
          const parts = detail.data.payload.parts || [detail.data.payload];
          
          for (const part of parts) {
            if (part.mimeType === 'text/plain' && part.body && part.body.data) {
              const bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
              
              // Enhanced regex patterns for different Google file types
              const patterns = {
                drive: /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g,
                docs: /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/g,
                sheets: /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/g,
                slides: /https:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/g,
                forms: /https:\/\/docs\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+)/g
              };

              // Extract all types of Google file links
              for (const [type, pattern] of Object.entries(patterns)) {
                const matches = bodyText.match(pattern) || [];
                for (const link of matches) {
                  const fileId = link.split('/d/')[1].split('/')[0];
                  attachments.push({
                    type: type,
                    fileId: fileId,
                    url: link
                  });
                }
              }
            }
            
            // Also check HTML parts for links
            if (part.mimeType === 'text/html' && part.body && part.body.data) {
              const htmlText = Buffer.from(part.body.data, 'base64').toString('utf-8');
              
              // Extract Google file links from HTML
              const patterns = {
                drive: /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g,
                docs: /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/g,
                sheets: /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/g,
                slides: /https:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/g,
                forms: /https:\/\/docs\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+)/g
              };

              for (const [type, pattern] of Object.entries(patterns)) {
                const matches = htmlText.match(pattern) || [];
                for (const link of matches) {
                  const fileId = link.split('/d/')[1].split('/')[0];
                  // Avoid duplicates
                  if (!attachments.some(att => att.fileId === fileId)) {
                    attachments.push({
                      type: type,
                      fileId: fileId,
                      url: link
                    });
                  }
                }
              }
            }
          }

          const senderInfo = this._parseEmailString(getHeader('From'));
          const recipientInfo = this._parseEmailString(getHeader('To'));

          return {
            id: msg.id,
            threadId: msg.threadId,
            subject: getHeader('Subject'),
            sender: getHeader('From'),
            recipient: getHeader('To'),
            senderName: senderInfo.name,
            senderEmail: senderInfo.email,
            recipientName: recipientInfo.name,
            recipientEmail: recipientInfo.email,
            date: getHeader('Date'),
            receivedAt: new Date(parseInt(detail.data.internalDate)),
            snippet,
            isUnread,
            isImportant,
            attachments
          };
        })
      );

      return messages;
    } catch (error) {
      console.error('Error getting Gmail messages:', error);
      throw new Error('Failed to fetch Gmail messages');
    }
  }

  // Delete Gmail message
  async deleteGmailMessage(tokens, messageId) {
    this.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      await gmail.users.messages.delete({
        userId: 'me',
        id: messageId
      });

      return { success: true, messageId };
    } catch (error) {
      console.error('Error deleting Gmail message:', error);
      throw new Error(`Failed to delete Gmail message: ${error.message}`);
    }
  }

  // Update Gmail message labels (for read/important status)
  async updateGmailMessage(tokens, messageId, { isRead, isImportant }) {
    this.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const addLabelIds = [];
      const removeLabelIds = [];

      // Handle read status
      if (isRead !== undefined) {
        if (isRead) {
          removeLabelIds.push('UNREAD');
        } else {
          addLabelIds.push('UNREAD');
        }
      }

      // Handle important status
      if (isImportant !== undefined) {
        if (isImportant) {
          addLabelIds.push('IMPORTANT');
        } else {
          removeLabelIds.push('IMPORTANT');
        }
      }

      // Apply label changes if any
      if (addLabelIds.length > 0 || removeLabelIds.length > 0) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            addLabelIds: addLabelIds.length > 0 ? addLabelIds : undefined,
            removeLabelIds: removeLabelIds.length > 0 ? removeLabelIds : undefined
          }
        });
      }

      return { success: true, messageId };
    } catch (error) {
      console.error('Error updating Gmail message:', error);
      throw new Error(`Failed to update Gmail message: ${error.message}`);
    }
  }

  // Delete Drive file
  async deleteDriveFile(tokens, fileId) {
    this.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    try {
      await drive.files.delete({
        fileId: fileId
      });

      return { success: true, fileId };
    } catch (error) {
      console.error('Error deleting Drive file:', error);
      throw new Error(`Failed to delete Drive file: ${error.message}`);
    }
  }

  // Update Drive file metadata
  async updateDriveFile(tokens, fileId, updates) {
    this.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    try {
      const updateData = {};
      
      if (updates.name) {
        updateData.name = updates.name;
      }

      const response = await drive.files.update({
        fileId: fileId,
        requestBody: updateData,
        fields: 'id, name, mimeType, modifiedTime'
      });

      return { success: true, fileId, data: response.data };
    } catch (error) {
      console.error('Error updating Drive file:', error);
      throw new Error(`Failed to update Drive file: ${error.message}`);
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
