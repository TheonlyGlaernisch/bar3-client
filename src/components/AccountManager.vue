<template>
  <div class="account-manager">
    <h2>Account</h2>

    <article class="api-help">
      Enter your Politics &amp; War API key to log in. This key is stored encrypted in MongoDB and is only used to send messages on your behalf.
      You can find it on
      <a target="_blank" href="https://politicsandwar.com/account">the Politics &amp; War account page</a>.
    </article>
      <div class="api-key-section">
      <label for="apiKey">Politics &amp; War API Key:</label>
      <input
        id="apiKey"
        v-model="apiKey"
        type="password"
        placeholder="Enter your API key"
        @keyup.enter="loginV2"
      />
      <button @click="loginV2" :disabled="!apiKey">Log in</button>
      <button class="ml-2" @click="logoutV2" :disabled="!v2Session">Logout</button>
    </div>

    <div v-if="v2Session" class="account-info">
      <div class="info-field">
        <label>Session:</label>
        <span>Logged in</span>
      </div>
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
import { v2Api } from '../utilities/v2Api';

@Component
export default class AccountManager extends Vue {
  apiKey = localStorage.getItem('apiKey') || '';
  error = '';
  statusMessage: { type: string; text: string } | null = null;
  v2Session = localStorage.getItem('pwSessionToken') || '';

  async loginV2() {
    this.error = '';
    this.statusMessage = null;
    try {
      const res = await v2Api.loginWithPwApiKey(this.apiKey);
      localStorage.setItem('pwSessionToken', res.token);
      localStorage.setItem('pwAccountId', res.accountId);
      localStorage.setItem('apiKey', this.apiKey);
      this.v2Session = res.token;
      this.$store.commit('setLoggedIn', true);
      this.statusMessage = { type: 'success', text: 'User loaded successfully' };

      // Immediately sync the top-right toggle state after login.
      const state = await v2Api.getAutomationState().catch(() => null);
      if (state) this.$store.commit('setApplicationState', !!state.enabled);
    } catch (e) {
      const maybeMessage =
        typeof e === 'object' && e !== null && 'message' in e ? (e as any).message : undefined;
      this.error = maybeMessage || 'Login failed';
      this.v2Session = '';
    }
  }

  logoutV2() {
    localStorage.removeItem('pwSessionToken');
    localStorage.removeItem('pwAccountId');
    this.v2Session = '';
    this.$store.commit('setLoggedIn', false);
    this.$store.commit('setApplicationState', false);
    this.statusMessage = { type: 'success', text: 'Logged out' };
  }

  mounted() {
    // Don’t auto-login; keep current behavior predictable.
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
