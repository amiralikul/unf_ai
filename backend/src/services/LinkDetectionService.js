export class LinkDetectionService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // Detect Trello card references in text
  extractTrelloCardReferences(text) {
    if (!text) return [];
    
    const patterns = [
      /https:\/\/trello\.com\/c\/([a-zA-Z0-9]+)/g,
      /trello\.com\/c\/([a-zA-Z0-9]+)/g,
      /#([A-Z]+-\d+)/g, // Custom card IDs if used
    ];
    
    const matches = new Set();
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        matches.add(match[1]);
      }
    });
    
    return Array.from(matches);
  }

  // Detect Google Drive file references in text
  extractDriveFileReferences(text) {
    if (!text) return [];
    
    const patterns = [
      /https:\/\/docs\.google\.com\/[^\/]+\/d\/([a-zA-Z0-9-_]+)/g,
      /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/g,
      /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9-_]+)/g,
    ];
    
    const matches = new Set();
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        matches.add(match[1]);
      }
    });
    
    return Array.from(matches);
  }

  // Find Trello card by Trello ID
  async findCardByTrelloId(trelloId, userId) {
    try {
      return await this.prisma.trelloCard.findFirst({
        where: {
          trello_id: trelloId,
          user_id: userId
        }
      });
    } catch (error) {
      console.error('Error finding card by Trello ID:', error);
      return null;
    }
  }

  // Find file by Google ID
  async findFileByGoogleId(googleId, userId) {
    try {
      return await this.prisma.file.findFirst({
        where: {
          google_id: googleId,
          user_id: userId
        }
      });
    } catch (error) {
      console.error('Error finding file by Google ID:', error);
      return null;
    }
  }

  // Create card-file links
  async linkCardToFile(cardId, fileId, linkType = 'reference', createdBy = 'auto') {
    try {
      // Check if link already exists
      const existingLink = await this.prisma.trelloCardFileLink.findUnique({
        where: {
          card_id_file_id: {
            card_id: cardId,
            file_id: fileId
          }
        }
      });

      if (existingLink) {
        console.log(`Link already exists between card ${cardId} and file ${fileId}`);
        return existingLink;
      }

      // Create new link
      const link = await this.prisma.trelloCardFileLink.create({
        data: {
          card_id: cardId,
          file_id: fileId,
          link_type: linkType,
          created_by: createdBy
        }
      });

      console.log(`Created link between card ${cardId} and file ${fileId} (type: ${linkType})`);
      return link;
    } catch (error) {
      console.error('Error creating card-file link:', error);
      throw error;
    }
  }

  // Create card-email links
  async linkCardToEmail(cardId, emailId, linkType = 'discussion', createdBy = 'auto') {
    try {
      // Check if link already exists
      const existingLink = await this.prisma.trelloCardEmailLink.findUnique({
        where: {
          card_id_email_id: {
            card_id: cardId,
            email_id: emailId
          }
        }
      });

      if (existingLink) {
        console.log(`Link already exists between card ${cardId} and email ${emailId}`);
        return existingLink;
      }

      // Create new link
      const link = await this.prisma.trelloCardEmailLink.create({
        data: {
          card_id: cardId,
          email_id: emailId,
          link_type: linkType,
          created_by: createdBy
        }
      });

      console.log(`Created link between card ${cardId} and email ${emailId} (type: ${linkType})`);
      return link;
    } catch (error) {
      console.error('Error creating card-email link:', error);
      throw error;
    }
  }

  // Process text and create links for a specific card
  async processCardText(cardId, text, userId) {
    const results = {
      fileLinks: [],
      emailLinks: [],
      errors: []
    };

    try {
      // Extract and process file references
      const fileRefs = this.extractDriveFileReferences(text);
      for (const googleId of fileRefs) {
        try {
          const file = await this.findFileByGoogleId(googleId, userId);
          if (file) {
            const link = await this.linkCardToFile(cardId, file.id, 'reference');
            results.fileLinks.push(link);
          }
        } catch (error) {
          results.errors.push(`Failed to link file ${googleId}: ${error.message}`);
        }
      }

      // Note: Email references would need additional patterns to detect email IDs
      // This could be extended based on specific email reference formats used

    } catch (error) {
      console.error('Error processing card text:', error);
      results.errors.push(`Failed to process card text: ${error.message}`);
    }

    return results;
  }

  // Process email text and create links
  async processEmailText(emailId, text, userId) {
    const results = {
      cardLinks: [],
      errors: []
    };

    try {
      // Extract Trello card references
      const cardRefs = this.extractTrelloCardReferences(text);
      for (const trelloId of cardRefs) {
        try {
          const card = await this.findCardByTrelloId(trelloId, userId);
          if (card) {
            const link = await this.linkCardToEmail(card.id, emailId, 'discussion');
            results.cardLinks.push(link);
          }
        } catch (error) {
          results.errors.push(`Failed to link card ${trelloId}: ${error.message}`);
        }
      }

    } catch (error) {
      console.error('Error processing email text:', error);
      results.errors.push(`Failed to process email text: ${error.message}`);
    }

    return results;
  }



  // Get all links for a specific card
  async getCardLinks(cardId) {
    try {
      const [fileLinks, emailLinks] = await Promise.all([
        this.prisma.trelloCardFileLink.findMany({
          where: { card_id: cardId },
          include: {
            file: {
              select: {
                id: true,
                name: true,
                google_id: true,
                web_view_link: true,
                modified_at: true
              }
            }
          }
        }),
        this.prisma.trelloCardEmailLink.findMany({
          where: { card_id: cardId },
          include: {
            email: {
              select: {
                id: true,
                subject: true,
                sender_email: true,
                received_at: true
              }
            }
          }
        })
      ]);

      return { fileLinks, emailLinks };
    } catch (error) {
      console.error('Error getting card links:', error);
      throw error;
    }
  }
} 