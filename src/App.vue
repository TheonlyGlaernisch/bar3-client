<template>
  <v-app>
    <v-app-bar
      app
      color="white"
      dark
      flat
    >
      <template v-if="['xs', 'sm'].includes($vuetify.breakpoint.name)">
        <v-app-bar-nav-icon light @click="sideBarOpen = true"/>
        <div
          class="d-flex align-center"
        >
          <v-img
            class="shrink mr-2"
            contain
            src="@/assets/bar3.png"
            transition="scale-transition"
            width="45"
          />
        </div>
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

@Component({
  name: 'App',
  components: {
    SideBar,
  }
})
export default class App extends Vue {
  sideBarOpen = false;
}
</script>

<style>
  @import url('styles/viewStyle.css');

  .v-toolbar__content {
    border-bottom: thin solid rgba(0, 0, 0, 0.12) !important;
  }
</style>
