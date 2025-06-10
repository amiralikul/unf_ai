import axios from 'axios';

export class TrelloService {
  constructor() {
    this.baseUrl = 'https://api.trello.com/1';
  }

  async getBoards(apiKey, token) {
    if (!apiKey || !token) {
      throw new Error('Trello API key and token are required');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/members/me/boards`, {
        params: {
          key: apiKey,
          token: token,
          fields: 'id,name,url'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Trello boards:', error.response ? error.response.data : error.message);
      throw new Error('Failed to fetch Trello boards');
    }
  }

  async getBoardLists(apiKey, token, boardId) {
    if (!apiKey || !token) {
      throw new Error('Trello API key and token are required');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/boards/${boardId}/lists`, {
        params: {
          key: apiKey,
          token: token,
          fields: 'id,name,pos'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching Trello lists for board ${boardId}:`, error.response ? error.response.data : error.message);
      throw new Error('Failed to fetch Trello lists');
    }
  }

  async getCardsForBoard(apiKey, token, boardId) {
    console.log('getCardsForBoard', apiKey, token, boardId);

    if (!apiKey || !token) {
      throw new Error('Trello API key and token are required');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/boards/${boardId}/cards`, {
        params: {
          key: apiKey,
          token: token,
          fields: 'id,name,desc,url,due,idList,labels,pos'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching Trello cards for board ${boardId}:`, error.response ? error.response.data : error.message);
      throw new Error('Failed to fetch Trello cards');
    }
  }

  // Helper method to map list names to standard status
  mapListNameToStatus(listName) {
    const name = listName.toLowerCase().trim();
    
    if (name.includes('to do') || name.includes('todo') || name.includes('backlog')) {
      return 'To Do';
    } else if (name.includes('doing') || name.includes('in progress') || name.includes('progress') || name.includes('working')) {
      return 'In Progress';
    } else if (name.includes('review') || name.includes('testing') || name.includes('qa')) {
      return 'Review';
    } else if (name.includes('done') || name.includes('complete') || name.includes('finished')) {
      return 'Done';
    } else {
      // Default mapping based on position - first list is usually To Do, last is usually Done
      return 'To Do'; // Will be refined in the controller with position logic
    }
  }

  // Helper method to extract priority from labels
  extractPriorityFromLabels(labels) {
    if (!labels || labels.length === 0) return null;
    
    for (const label of labels) {
      const name = label.name.toLowerCase();
      const color = label.color;
      
      // Check label names
      if (name.includes('high') || name.includes('urgent') || name.includes('critical')) {
        return 'High';
      } else if (name.includes('medium') || name.includes('normal')) {
        return 'Medium';
      } else if (name.includes('low') || name.includes('minor')) {
        return 'Low';
      }
      
      // Check label colors (common Trello convention)
      if (color === 'red') {
        return 'High';
      } else if (color === 'yellow' || color === 'orange') {
        return 'Medium';
      } else if (color === 'green' || color === 'blue') {
        return 'Low';
      }
    }
    
    return 'Medium'; // Default priority
  }
} 