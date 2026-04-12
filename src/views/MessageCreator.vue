

<template>
  <div class="view-small-inner-wrapper view-padding-inner-wrapper">
    <div class="d-flex align-center mb-4">
      <h1 class="">Message Creator</h1>
      <v-btn
        outlined
        color="primary"
        class="ml-auto"
        @click="testDialog = true"
      >
        Test
      </v-btn>
    </div>
    <update-available-banner/>
    <v-text-field
      dense
      outlined
      placeholder="Subject Line"
      maxlength="40"
      v-model="subject"
      @change="changes()"
      class="mt-4 mb-4"
    />
    <div class="mt-2 mb-2">
      The editor allows you to easily create your own custom message. You can either choose between the Basic Editor with WYSIWYG controls,
      or the advanced editor with HTML and CSS. With both editors it is recommended you use the test button to try out sending a message before
      you turn on Bar 3 and send it to new nations. Finally, you can use two variables in your messages. Use <code>\(nation)</code> to substitute the
      nation name, and use <code>\(leader)</code> to substitute the leader name in your messages or subject line.
    </div>

    <v-card outlined class="pa-4 mb-4">
      <div class="d-flex align-center flex-wrap" style="gap: 12px;">
        <h3 class="mb-0">Automation Bulk Send</h3>
        <v-spacer />
        <v-text-field
          dense
          outlined
          hide-details
          class="city-filter-input"
          type="number"
          min="0"
          v-model.number="minCities"
          label="Min Cities"
        />
        <v-text-field
          dense
          outlined
          hide-details
          class="city-filter-input"
          type="number"
          min="0"
          v-model.number="maxCities"
          label="Max Cities"
        />
        <v-select
          dense
          outlined
          hide-details
          class="discord-filter-select"
          :items="discordFilterOptions"
          item-text="label"
          item-value="value"
          v-model="discordFilterHasDiscord"
          label="Discord Filter"
        />
      </div>
      <div class="d-flex flex-wrap mt-3" style="gap: 12px;">
        <v-btn
          color="primary"
          :loading="bulkActionLoading === 'unallied'"
          :disabled="!!bulkActionLoading"
          @click="runBulkSend('unallied')"
        >
          Send to Active (24h) + No Alliance
        </v-btn>
        <v-btn
          color="primary"
          outlined
          :loading="bulkActionLoading === 'discord'"
          :disabled="!!bulkActionLoading"
          @click="runBulkSend('discord')"
        >
          Send to Active (24h) + No Alliance + Discord Filter
        </v-btn>
      </div>

      <v-alert
        v-if="bulkError"
        type="error"
        dense
        outlined
        class="mt-3 mb-0"
      >
        {{ bulkError }}
      </v-alert>

      <div v-if="bulkPreview" class="mt-4">
        <h4 class="mb-1">Preview</h4>
        <div class="grey--text text--lighten-1">
          {{ bulkPreview.totalCandidates }} candidate{{ bulkPreview.totalCandidates === 1 ? '' : 's' }}
        </div>
        <v-list dense class="preview-list mt-2">
          <v-list-item v-for="(row, idx) in bulkPreviewRows" :key="`preview-${idx}`">
            <v-list-item-content>
              <v-list-item-title>{{ row }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-if="bulkPreviewRows.length === 0">
            <v-list-item-content>
              <v-list-item-title class="grey--text">No preview rows returned.</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>

      <div v-if="bulkResult" class="mt-4">
        <h4 class="mb-1">Last Send Result</h4>
        <div>Attempted: {{ bulkResult.attempted }}</div>
        <div>Sent: {{ bulkResult.sent }}</div>
        <div>Failed: {{ bulkResult.failed }}</div>
        <v-list dense v-if="bulkResultFailures.length > 0" class="preview-list mt-2">
          <v-subheader>Failures (first {{ bulkResultFailures.length }})</v-subheader>
          <v-list-item v-for="(failure, idx) in bulkResultFailures" :key="`failure-${idx}`">
            <v-list-item-content>
              <v-list-item-title>{{ failure }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
    </v-card>

    <v-tabs v-model="editorTab" class="mt-2" style="margin-bottom: 200px" @change="changes()">
      <v-tab>
        Basic Editor
      </v-tab>
      <v-tab>
        Advanced Editor
      </v-tab>

      <v-tab-item class="mt-2">
        <message-creator 
          @change="messageHTML.quill = $event; changes()" 
          :inputHTML="config.messageHTML"
        />
      </v-tab-item>
      <v-tab-item class="mt-2">
        <advanced-message-creator 
          @change="messageHTML.advanced = $event; changes()" 
          :inputHTML="config.advancedRaw.html" 
          :inputCSS="config.advancedRaw.css" 
          @html="advancedRaw.html = $event; changes()"
          @css="advancedRaw.css = $event; changes()"
        />
      </v-tab-item>
    </v-tabs>
    <saved-changes-card
      v-model="saveChangesOpen"
      @save="save($event)"
    />
    <test-message-dialog v-model="testDialog" @send="testMessage($event)"/>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import getConfig from '@/actions/getConfig';
  import sendConfig from '@/actions/sendConfig';
  import { Config, DefaultConfig } from '@/types';
  import MessageCreator from '@/components/MessageCreator.vue';
  import AdvancedMessageCreator from '@/components/AdvancedMessageCreator.vue';
  import SavedChangesCard from '@/components/SavedChangesCard.vue';
  import TestMessageDialog from '@/components/TestMessageDialog.vue';
  import sendMessage from '@/actions/sendMessage';
  import UpdateAvailableBanner from '@/components/UpdateAvailableBanner.vue';
  import { v2Api } from '@/utilities/v2Api';
  import ConfirmDialog from '@/components/ConfirmDialog.vue';
  
  @Component({
  components: {
    MessageCreator,
    AdvancedMessageCreator,
    SavedChangesCard,
    TestMessageDialog,
    UpdateAvailableBanner,
    ConfirmDialog  // Add this line
  }
})
  export default class MessageDesigner extends Vue {
    config: Config = new DefaultConfig();
    messageHTML = {
      quill: '',
      advanced: '',
    };
    advancedRaw = {
      html: '',
      css: '',
    };
    editorTab = 0;
    subject = '';
    saveChangesOpen = false;
    error = false;
    testDialog = false;
    bulkActionLoading: null | 'unallied' | 'discord' = null;
    discordFilterHasDiscord = true;
    minCities: number | null = null;
    maxCities: number | null = null;
    bulkPreview: null | { totalCandidates: number; previewRows: any[] } = null;
    bulkResult: null | { attempted: number; sent: number; failed: number; failures: any[] } = null;
    bulkError = '';
    confirmDialogOpen = false;
    confirmDialogMessage = '';
    confirmDialogResolve: ((value: boolean) => void) | null = null;

    get discordFilterOptions() {
      return [
        { label: 'Has Discord', value: true },
        { label: 'No Discord', value: false },
      ];
    }

    get bulkPreviewRows(): string[] {
      return (this.bulkPreview?.previewRows || []).slice(0, 15).map((row: any) => this.formatNationRow(row));
    }

    get bulkResultFailures(): string[] {
      return (this.bulkResult?.failures || []).slice(0, 5).map((row: any) => {
        const nation = row?.nation || row?.nationName || row?.leader || row?.id || 'Unknown nation';
        const error = row?.error || row?.reason || 'Unknown error';
        return `${nation}: ${error}`;
      });
    }

    async mounted() {
      const config = await getConfig();
      if (config && !(config instanceof Error)) {
        this.advancedRaw.html = (config.advancedRaw && config.advancedRaw.html) || '';
        this.advancedRaw.css = (config.advancedRaw && config.advancedRaw.css) || '';
        this.messageHTML.quill = config.messageHTML || '';
        this.subject = config.messageSubject || '';
        this.config = config;
        this.editorTab = config.currentEditor || 0;
        this.changes();
      } else {
        alert('Couldn\'t retrieve your config!');
      }
    }

    changes() {
      if (this.editorTab == 0 && this.messageHTML.quill != this.config.messageHTML) {
        this.saveChangesOpen = true;
        return;
      } else if (this.editorTab == 1 && (
        this.advancedRaw.html != (this.config.advancedRaw && this.config.advancedRaw.html) ||
        this.advancedRaw.css != (this.config.advancedRaw && this.config.advancedRaw.css)
      )) {
        this.saveChangesOpen = true;
        return;
      } else if (this.subject != this.config.messageSubject) {
        this.saveChangesOpen = true;
        return;
      } else if (this.editorTab != this.config.currentEditor) {
        this.saveChangesOpen = true;
        return;
      }

      this.saveChangesOpen = false;
    }

    async save() {
      if (!this.$store.getters.isLoggedIn) {
        alert('You must log in (Account tab) before saving to the cloud.');
        return;
      }

      const token = localStorage.getItem('pwSessionToken') || '';

      const newConfig = {
        messageSubject: this.subject,
        messageHTML: (this.editorTab == 0) ? this.messageHTML.quill : this.messageHTML.advanced,
        advancedRaw: {
          html: this.advancedRaw.html,
          css: this.advancedRaw.css,
        },
        currentEditor: this.editorTab,
      };

      const res = await sendConfig(newConfig);
      Object.assign(this.config, newConfig);

      if (!res) {
        this.error = true;
        alert('Couldn\'t update config! Please try again and verify the server is running.');
      } else {
        this.saveChangesOpen = false;
      }

      // v2 per-user template save (MongoDB). This is what automation uses.
      if (!token) {
        alert('To save your auto-message to MongoDB, go to Account and log in first.');
        return;
      }

      try {
        await v2Api.upsertTemplate({
          subject: this.subject,
          bodyHtml: (this.editorTab == 0) ? this.messageHTML.quill : this.advancedRaw.html,
          bodyCss: (this.editorTab == 0) ? undefined : this.advancedRaw.css,
          bodyText: undefined,
          currentEditor: this.editorTab,
        });
      } catch (e) {
        console.error(e);
        alert('Saved locally, but failed to save to MongoDB. Please try again.');
      }
    }
    async testMessage(nationDetails: {nationName: string; nationID: string; leaderName: string}) {
      const success = await sendMessage((this.editorTab == 0) ? this.messageHTML.quill : this.messageHTML.advanced, nationDetails); 
      if (!success) alert('Couldn\'t send your message!');
    }

    formatNationRow(row: any): string {
      if (!row || typeof row !== 'object') return String(row);
      const nation = row.nation || row.nationName || row.name || row.nation_id || row.id;
      const leader = row.leader || row.leaderName;
      const discord = row.discord || row.hasDiscord;
      const cities = row.cities;
      const pieces = [nation ? `Nation: ${nation}` : '', leader ? `Leader: ${leader}` : ''].filter(Boolean);
      if (typeof cities === 'number') {
        pieces.push(`Cities: ${cities}`);
      }
      if (discord !== undefined && discord !== null) {
        pieces.push(`Discord: ${discord ? 'Yes' : 'No'}`);
      }
      return pieces.length > 0 ? pieces.join(' | ') : JSON.stringify(row);
    }

    normalizePreview(data: any): { totalCandidates: number; previewRows: any[] } {
      const previewRows = data?.preview || data?.candidates || data?.rows || [];
      const totalCandidates = Number(data?.totalCandidates ?? previewRows.length ?? 0);
      return {
        totalCandidates,
        previewRows: Array.isArray(previewRows) ? previewRows : [],
      };
    }

    normalizeResult(data: any): { attempted: number; sent: number; failed: number; failures: any[] } {
      return {
        attempted: Number(data?.attempted || 0),
        sent: Number(data?.sent || 0),
        failed: Number(data?.failed || 0),
        failures: Array.isArray(data?.failures) ? data.failures : [],
      };
    }

    getCityPayload(): { minCities?: number; maxCities?: number } {
      const payload: { minCities?: number; maxCities?: number } = {};
      if (typeof this.minCities === 'number' && Number.isFinite(this.minCities)) {
        payload.minCities = this.minCities;
      }
      if (typeof this.maxCities === 'number' && Number.isFinite(this.maxCities)) {
        payload.maxCities = this.maxCities;
      }
      return payload;
    }

    hasValidCityRange(): boolean {
      if (typeof this.minCities === 'number' && this.minCities < 0) return false;
      if (typeof this.maxCities === 'number' && this.maxCities < 0) return false;
      if (typeof this.minCities === 'number' && typeof this.maxCities === 'number' && this.minCities > this.maxCities) {
        return false;
      }
      return true;
    }

    async runBulkSend(mode: 'unallied' | 'discord') {
      this.bulkActionLoading = mode;
      this.bulkResult = null;
      this.bulkError = '';
      try {
        if (!localStorage.getItem('pwSessionToken')) {
          this.bulkError = 'Unauthorized: please log in from Account with your Politics & War API key.';
          return;
        }

        if (!this.hasValidCityRange()) {
          this.bulkError = 'Invalid city filter. Ensure min/max are >= 0 and min is not greater than max.';
          return;
        }

        const cityPayload = this.getCityPayload();

        const previewResponse = mode === 'unallied'
          ? await v2Api.sendActiveUnallied({ dryRun: true, ...cityPayload })
          : await v2Api.sendActiveUnalliedDiscord({ dryRun: true, hasDiscord: this.discordFilterHasDiscord, ...cityPayload });

        this.bulkPreview = this.normalizePreview(previewResponse);
        const confirmed = await this.showConfirmDialog(`Send to ${this.bulkPreview.totalCandidates} nations?`);
        if (!confirmed) return;

        const sendResponse = mode === 'unallied'
          ? await v2Api.sendActiveUnallied({ dryRun: false, ...cityPayload })
          : await v2Api.sendActiveUnalliedDiscord({ dryRun: false, hasDiscord: this.discordFilterHasDiscord, ...cityPayload });

        this.bulkResult = this.normalizeResult(sendResponse);
      } catch (e) {
        const message = typeof e === 'object' && e !== null && 'message' in e ? (e as any).message : 'Request failed';
        if (message.includes('Failed to fetch target nations from Politics & War API')) {
          this.bulkError = 'Failed to fetch target nations from Politics & War API. Please retry in a moment. If this persists, contact the server admin to verify backend Politics & War lookup configuration.';
        } else {
          this.bulkError = message;
        }
      } finally {
        this.bulkActionLoading = null;
      }
    }
  }
</script>

<style>
  .save-changes-card {
    position: fixed;
    bottom: 50px;
    right: 50px;
    width: 300px;
  }

  @media only screen and (max-width: 450px) {
    .save-changes-card {
      width: calc(100% - 20px);
      right: 10px;
      left: 10px;
    }
  }
</style>

<style scoped>
.discord-filter-select {
  max-width: 260px;
  min-width: 220px;
}

.city-filter-input {
  max-width: 150px;
}

.preview-list {
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
}
</style>

<style>
  .slideup-enter-active, .slideup-leave-active {
    transition: bottom 0.2s ease-out
  }
  .slideup-enter, .slideup-leave-to {
    bottom: -200px;
  }
</style>
