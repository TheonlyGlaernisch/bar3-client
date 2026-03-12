import axios from 'axios';

const SERVER_BASE_URL = process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';
const API_BASE_URL = `${SERVER_BASE_URL}/api`;

interface AccountData {
  apiKey: string;
  customMessage: string;
  createdAt: string;
}

export const accountApi = {
  async getAccount(apiKey: string): Promise<AccountData> {
    const response = await axios.get(`${API_BASE_URL}/account`, {
      headers: {
        'x-api-key': apiKey
      }
    });
    return response.data;
  },

  async updateMessage(
    apiKey: string,
    message: string
  ): Promise<{ success: boolean; customMessage: string }> {
    const response = await axios.post(
      `${API_BASE_URL}/account/message`,
      { message },
      {
        headers: {
          'x-api-key': apiKey
        }
      }
    );
    return response.data;
  },

  async createApiKey(): Promise<{ success: boolean; apiKey: string }> {
    const response = await axios.post(`${API_BASE_URL}/api-key/create`);
    return response.data;
  }
};
