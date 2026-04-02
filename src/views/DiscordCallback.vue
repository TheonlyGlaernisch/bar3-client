<template>
  <v-app style="background: #0f0f0f;">
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="5" lg="4">
            <v-card class="pa-8" dark color="#1A1A1A" style="border-radius: 16px !important;">
              <div class="text-center">
                <v-progress-circular
                  v-if="loading"
                  indeterminate
                  color="#5865F2"
                  size="56"
                  class="mb-4"
                />
                <v-icon
                  v-else-if="success"
                  color="success"
                  size="56"
                  class="mb-4"
                >
                  mdi-check-circle-outline
                </v-icon>
                <v-icon
                  v-else
                  color="error"
                  size="56"
                  class="mb-4"
                >
                  mdi-alert-circle-outline
                </v-icon>

                <div class="text-h6 white--text font-weight-medium mb-2">
                  {{ title }}
                </div>
                <div class="body-2 text--secondary">
                  {{ subtitle }}
                </div>
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
export default class DiscordCallback extends Vue {
  loading = true;
  success = false;
  title = 'Verifying your Discord membership…';
  subtitle = 'Please wait while we confirm your access.';

  async created() {
    const code = this.$route.query.code;
    const NO_CODE_MSG = 'No authorization code received from Discord.';

    if (typeof code !== 'string' || !code) {
      this.loading = false;
      this.title = 'Authentication failed';
      this.subtitle = NO_CODE_MSG;
      this.redirectToLoginWithError(NO_CODE_MSG);
      return;
    }

    try {
      const token = await discordAuth.exchangeCode(code);
      discordAuth.saveToken(token);
      this.$store.commit('setDiscordAuthed', true);
      this.loading = false;
      this.success = true;
      this.title = 'Access granted!';
      this.subtitle = 'Redirecting you to the app…';
      setTimeout(() => this.$router.replace('/'), 1200);
    } catch (e) {
      const msg =
        typeof e === 'object' && e !== null && 'message' in e
          ? (e as Error).message
          : 'Discord authentication failed';
      this.loading = false;
      this.title = 'Access denied';
      this.subtitle = msg;
      this.redirectToLoginWithError(msg);
    }
  }

  private redirectToLoginWithError(error: string) {
    setTimeout(
      () => this.$router.replace({ path: '/discord-login', query: { error } }),
      1500
    );
  }
}
</script>
