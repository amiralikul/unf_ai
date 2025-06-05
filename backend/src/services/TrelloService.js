import axios from 'axios';

class TrelloService {
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
        //   fields: 'id,name,desc,url,due,idList'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching Trello cards for board ${boardId}:`, error.response ? error.response.data : error.message);
      throw new Error('Failed to fetch Trello cards');
    }
  }
}

export default new TrelloService(); 