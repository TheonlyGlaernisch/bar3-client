<template>
  <div class="view-small-inner-wrapper view-padding-inner-wrapper fill-height mb-10">
    <v-card outlined class="mb-6" v-if="v2LoggedIn">
      <v-card-title>Per-user Analytics</v-card-title>
      <v-card-text>
        <div class="mb-2">
          Views: <strong>{{ v2ViewsTotal }}</strong>
        </div>
        <div class="mb-2">
          Link Clicks: <strong>{{ v2ClicksTotal }}</strong>
        </div>
        <div v-if="v2AnalyticsLoaded" class="mt-4">
          <h4>Top Links</h4>
          <div v-for="l in v2Analytics.links.slice(0, 10)" :key="l.shortId" class="d-flex justify-space-between">
            <span style="max-width: 75%; overflow:hidden; text-overflow: ellipsis; white-space: nowrap;">{{ l.url }}</span>
            <span>{{ l.clickCount }}</span>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <div v-if="enabled">
      <v-row>
        <v-col cols="12" md="8">
          <h1>Analytics Manager</h1>
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            class="ml-auto"
            :items="campaigns"
            v-model="selectedCampaign"
            return-object
            v-if="loaded"
            filled
            hide-details
            item-text="name"
            label="Select a Campaign"
            append-outer-icon="mdi-plus-circle"
            @click:append-outer="openCreateDialog()"
          >
          </v-select>
        </v-col>
      </v-row>
      <div class="mb-4 mt-4">
        <analytics-graph-card v-if="loaded" :campaign="selectedCampaign" class="mt-4"/>
      </div>
      <v-row>
      <v-col cols="12" md="4">
        <v-card
          outlined
          height="250px"
          v-if="loaded"
        >
            <v-card-title>
              Views
            </v-card-title>
            <v-card-text>
              <h4>
                Viewed to Sent Messages Ratio
              </h4>
              <h2>
                {{ selectedCampaign.messagePixel.readCount }} / {{ selectedCampaign.sentCount }}
              </h2>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="8">
          <analytics-link-card v-if="loaded" :campaign="selectedCampaign"/>
        </v-col>
      </v-row>

      <create-campaign-dialog v-model="createCampaignDialog" @created="createdNewCampaign()"/>
    </div>

    <v-container class="fill-height" fluid v-else-if="loaded">
      <v-row class="text-center mt-n16">
        <v-col class="ma-auto" style="max-width: fit-content" xs="10" md="7">
          <h2>
            Analytics
          </h2>
          <div>
            Enable analytics in <router-link to="/config">Configuration</router-link> to get access to message analytics.
            Message Analytics allows you to track the number of views and clicks of links inside your messages
            over time.
          </div>
        </v-col>
      </v-row>
    </v-container>

    <div v-if="!loaded">
      <v-skeleton-loader
        class="mx-auto"
        type="image"
      ></v-skeleton-loader>
      <v-row class="mt-6">
        <v-col cols="12" md="6">
          <v-skeleton-loader
            class="mx-auto"
            type="image"
          ></v-skeleton-loader>
        </v-col>
        <v-col cols="12" md="6">
          <v-skeleton-loader
            class="mx-auto"
            type="image"
          ></v-skeleton-loader>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script lang="ts">
import {Vue, Component} from 'vue-property-decorator';
import AnalyticsGraphCard from '@/components/AnalyticsGraphCard.vue';
import AnalyticsLinkCard from '@/components/AnalyticsLinksCard.vue';
import CreateCampaignDialog from '@/components/CreateAnalyticsCampaignDialog.vue';
import getCampaigns from '@/actions/getAnalyticalCampaigns';
import getConfig from '@/actions/getConfig';
import { AnalyticalCampaign } from '@/interfaces/analytics';
import { v2Api } from '@/utilities/v2Api';

@Component({
  components: {
    AnalyticsGraphCard,
    AnalyticsLinkCard,
    CreateCampaignDialog
  }
})
export default class AnalyticsManager extends Vue {
  loaded = false;
  enabled = false
  selectedCampaign: AnalyticalCampaign | null = null;
  createCampaignDialog = false;
  get v2LoggedIn() {
  return this.$store.getters.isLoggedIn;
  }
  v2AnalyticsLoaded = false;
  v2Analytics: any = { links: [], messages: [] };

  get v2ViewsTotal(): number {
    return (this.v2Analytics?.messages || []).reduce((sum: number, m: any) => sum + (m.viewCount || 0), 0);
  }

  get v2ClicksTotal(): number {
    return (this.v2Analytics?.links || []).reduce((sum: number, l: any) => sum + (l.clickCount || 0), 0);
  }

  get campaigns() {
    return this.$store.getters['analytics/campaigns'];
  }

  openCreateDialog() {
    this.createCampaignDialog = true;
  }

  createdNewCampaign() {
    this.loaded = false;
    
    this.loadAnalytics();
  }

  async loadAnalytics() {
    this.enabled = true;

    await getCampaigns();

    if (this.campaigns.length > 0) {
      this.selectedCampaign = this.campaigns[this.campaigns.length - 1];
      this.loaded = true;
    } else {
      this.openCreateDialog();
    }
  }

  async mounted() {
    if (this.v2LoggedIn) {
      try {
        this.v2Analytics = await v2Api.getMyAnalytics();
      } finally {
        this.v2AnalyticsLoaded = true;
      }
    }

    const config = await getConfig();

    if (config && !(config instanceof Error) && config.analyticsEnabled) {
      await this.loadAnalytics();
    } else {
      this.loaded = true;
    }
  }
}
</script>
