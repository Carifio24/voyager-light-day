<template>
  <slot
    :planet-scale="planetScale"
    :log-planet-scale="logPlanetScale"
  >
    <v-slider
      v-model="planetScale"
      min="1"
      max="100"
      step="0.01"
      label="Planet Scale"
      thumb-label
      class="mt-2"
    ></v-slider>
  </slot>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Settings } from "@wwtelescope/engine";

const settings = Settings.get_active();

function setPlanetScale(scale: number) {
  if (scale !== 1) {
    settings.set_solarSystemScale(scale);
    settings.set_actualPlanetScale(false);
    return;
  }
  settings.set_solarSystemScale(scale);
  settings.set_actualPlanetScale(true);
}

const planetScale = ref(settings.get_solarSystemScale());

watch(planetScale, (newScale) => {
  setPlanetScale(newScale);
});

const logPlanetScale = computed({
  get: () => Math.log10(planetScale.value),
  set: (logScale: number) => {
    planetScale.value = Math.pow(10, logScale);
  },
});

watch([planetScale, logPlanetScale], ([newPlanetScale, newLogPlanetScale]) => {
  console.table({
    planetScale: newPlanetScale,
    logPlanetScale: newLogPlanetScale,
  });
});
</script>

<style scoped></style>
