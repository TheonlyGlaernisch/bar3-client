<template>
  <v-app>
    <v-app-bar
      app
      color="white"
      dark
      flat
    >
      <div class="d-flex align-center">
        <v-img
          class="shrink mr-2"
          contain
          src="@/assets/bar3.png"
          transition="scale-transition"
          width="45"
        />
        <div class="ml-2 grey--text text--darken-3 text-h6 font-weight-medium">
          Bar 3
        </div>
      </div>

      <v-spacer />

      <v2-automation-toggle class="mr-2" />

      <template v-if="['xs', 'sm'].includes($vuetify.breakpoint.name)">
        <v-app-bar-nav-icon light @click="sideBarOpen = true"/>
      </template>
    </v-app-bar>

    <side-bar v-model="sideBarOpen" :disabled="false"/>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import SideBar from '@/components/SideBar.vue';
import V2AutomationToggle from '@/components/V2AutomationToggle.vue';
import { v2Api } from '@/utilities/v2Api';

@Component({
  name: 'App',
  components: {
    SideBar,
    V2AutomationToggle,
  }
})
export default class App extends Vue {
  sideBarOpen = false;

  async mounted() {
    const token = localStorage.getItem('pwSessionToken') || '';
    if (!token) return;
    try {
      const state = await v2Api.getAutomationState();
      this.$store.commit('setApplicationState', !!state.enabled);
    } catch {
      // ignore
    }
  }
}
</script>

<style>
  @import url('styles/viewStyle.css');

  .v-toolbar__content {
    border-bottom: thin solid rgba(0, 0, 0, 0.12) !important;
  }
</style>
