<template>
  <div class="account-manager">
    <h2>Account Management</h2>

    <div class="api-key-create">
      <button @click="createApiKey" :disabled="creatingKey">
        {{ creatingKey ? 'Creating...' : 'Create New API Key' }}
      </button>
    </div>

    <div class="api-key-section">
      <label for="apiKey">API Key:</label>
      <input
        id="apiKey"
        v-model="apiKey"
        type="password"
        placeholder="Enter your API key"
        @keyup.enter="loadAccount"
      />
      <button @click="loadAccount" :disabled="!apiKey">Load Account</button>
    </div>

    <div v-if="account" class="account-info">
      <div class="info-field">
        <label>API Key:</label>
        <span>{{ maskApiKey(account.apiKey) }}</span>
      </div>
      <div class="info-field">
        <label>Created:</label>
        <span>{{ new Date(account.createdAt).toLocaleString() }}</span>
      </div>
    </div>

    <div v-if="account" class="message-section">
      <label for="customMessage">Custom Message:</label>
      <textarea
        id="customMessage"
        v-model="customMessage"
        placeholder="Enter your custom message"
        rows="5"
      ></textarea>
      <button @click="saveMessage" :disabled="!customMessage">Save Message</button>
    </div>

    <div v-if="statusMessage" :class="['status', statusMessage.type]">
      {{ statusMessage.text }}
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { accountApi } from '../utilities/AccountAPI';

@Component
export default class AccountManager extends Vue {
  apiKey: string = localStorage.getItem('apiKey') || '';
  customMessage: string = '';
  account: any = null;
  error: string = '';
  creatingKey = false;
  statusMessage: { type: string; text: string } | null = null;

  async createApiKey() {
    this.error = '';
    this.statusMessage = null;
    this.creatingKey = true;

    try {
      const result = await accountApi.createApiKey();
      this.apiKey = result.apiKey;
      localStorage.setItem('apiKey', this.apiKey);

      this.statusMessage = {
        type: 'success',
        text: 'New API key created. Load account to continue.'
      };
    } catch (err: any) {
      this.error = 'Failed to create API key';
    } finally {
      this.creatingKey = false;
    }
  }

  async loadAccount() {
    this.error = '';
    this.statusMessage = null;

    try {
      const account = await accountApi.getAccount(this.apiKey);
      this.account = account;
      this.customMessage = account.customMessage;
      localStorage.setItem('apiKey', this.apiKey);

      this.statusMessage = {
        type: 'success',
        text: 'Account loaded successfully'
      };
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        this.error = 'Invalid API key';
      } else {
        this.error = 'Failed to load account';
      }
      this.account = null;
    }
  }

  async saveMessage() {
    this.error = '';
    this.statusMessage = null;

    try {
      await accountApi.updateMessage(this.apiKey, this.customMessage);
      this.statusMessage = {
        type: 'success',
        text: 'Message saved successfully'
      };
    } catch (err: any) {
      this.error = 'Failed to save message';
    }
  }

  maskApiKey(key: string): string {
    if (!key || key.length < 12) return key;
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  }

  mounted() {
    if (this.apiKey) {
      this.loadAccount();
    }
  }
}
</script>

<style scoped>
.account-manager {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.api-key-create,
.api-key-section,
.message-section {
  margin: 20px 0;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

input,
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
}

button {
  margin-top: 10px;
  margin-right: 8px;
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.account-info {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  margin: 20px 0;
}

.info-field {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
}

.status {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
}

.status.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error {
  color: #721c24;
  background-color: #f8d7da;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  border: 1px solid #f5c6cb;
}
</style>
