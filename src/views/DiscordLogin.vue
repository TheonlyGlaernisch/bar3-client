<template>
  <v-app style="background: #0f0f0f;">
    <v-main>
      <v-container
        class="fill-height"
        fluid
      >
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="5" lg="4">
            <v-card class="discord-login-card pa-8" dark color="#1A1A1A">
              <div class="text-center mb-6">
                <v-img
                  class="mx-auto mb-4"
                  contain
                  src="@/assets/bar3.png"
                  max-width="72"
                />
                <div class="text-h5 white--text font-weight-bold mb-1">Bar 3</div>
                <div class="text--secondary body-2">
                  You must verify your Discord membership before accessing this site.
                </div>
              </div>

              <v-alert v-if="error" type="error" dense class="mb-4">
                {{ error }}
              </v-alert>

              <v-btn
                block
                large
                color="#5865F2"
                dark
                class="discord-btn"
                :loading="loading"
                @click="login"
              >
                <v-icon left>mdi-discord</v-icon>
                Login with Discord
              </v-btn>

              <div class="text-center mt-4 caption text--secondary">
                Access is restricted to authorized Discord members only.
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { discordAuth } from '@/utilities/discordAuth';

@Component
export default class DiscordLogin extends Vue {
  loading = false;
  error = '';

  created() {
    // If already authenticated, go straight to the app.
    if (discordAuth.isAuthed()) {
      this.$router.replace('/');
    }

    // Surface any error message passed as a query param (e.g. from the callback).
    const queryError = this.$route.query.error;
    if (typeof queryError === 'string' && queryError) {
      this.error = queryError;
    }
  }

  async login() {
    this.loading = true;
    this.error = '';
    await discordAuth.redirectToDiscord();
  }
}
</script>

<style scoped>
.discord-login-card {
  border: 1px solid rgba(88, 101, 242, 0.3) !important;
  border-radius: 16px !important;
}

.discord-btn {
  border-radius: 8px !important;
  font-weight: 600;
  letter-spacing: 0.03em;
}
</style>
