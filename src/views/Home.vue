<template>
  <div class="home view-small-inner-wrapper view-padding-inner-wrapper">
    <h1>Dashboard</h1>
    <div class="text-subtitle-1 grey--text text--lighten-1">Last refreshed {{ refreshedSecondsAgo }} second{{ refreshedSecondsAgo != 1 ? 's' : '' }} ago</div>
    <update-available-banner class="mt-4"/>
    <div class="dashboard-cards-container mt-6">
      <graph-card class="dashboard-card" graphType="messagesSentOverTime"/>
      <graph-card class="dashboard-card" graphType="apiRequests"/>
      <messages-sent-card class="dashboard-card"/>
    </div>
    <v-btn
      fab
      fixed
      color="primary"
      dark
      bottom
      right
      @click="refreshData"
    >
      <v-icon>
        mdi-refresh
      </v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import GraphCard from '@/components/GraphCard.vue';
import MessagesSentCard from '@/components/MessagesSentCard.vue';
import UpdateAvailableBanner from '@/components/UpdateAvailableBanner.vue';
import getAppData from '@/actions/getAppData';

@Component({
  components: {
    GraphCard,
    MessagesSentCard,
    UpdateAvailableBanner
  }
})
export default class Home extends Vue {
  refreshedSecondsAgo = 0;

  get lastRefreshed() {
    return this.$store.getters.lastRefreshed;
  }

  updateLastRefreshed() {
    setTimeout(() => {
      this.updateLastRefreshed();
      this.refreshedSecondsAgo = Math.floor((Date.now() - this.lastRefreshed) / 1000);
    }, 1000);
  }

  async fetchApiDetails() {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) return;
    const data = await getAppData();
    if (data) {
      this.$store.commit('setAPIDetails', { used: data.apiDetails.used, max: data.apiDetails.max });
      this.$store.commit('setSentMessages', data.sentMessages);
    }
  }

  async refreshData() {
    this.$store.commit('setLastRefreshed', Date.now());
    await this.fetchApiDetails();
  }

  async mounted() {
    this.updateLastRefreshed();
    await this.refreshData();
  }
}
</script>

<style scoped>
  .dashboard-cards-container {
    display: flex;
    flex-wrap: wrap;
  }

  .dashboard-card {
    margin-top: 16px;
  }

  @media only screen and (min-width: 450px) {
    .dashboard-card {
      margin-right: 16px;
    }
  }
</style>
