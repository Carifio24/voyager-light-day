<template>
  <span class="light-day-countdown">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

const props = defineProps<{
  target: Date;
}>();

const now = ref(Date.now());
const timer = setInterval(() => (now.value = Date.now()), 1000);
onBeforeUnmount(() => clearInterval(timer));

const pad = (n: number) => `${n}`.padStart(2, "0");

const text = computed(() => {
  const s = Math.floor((props.target.getTime() - now.value) / 1000);
  if (s <= 0) {
    return "Now!";
  }
  const days = Math.floor(s / 86400);
  return `${days} d ${pad(Math.floor((s % 86400) / 3600))} h ${pad(Math.floor((s % 3600) / 60))} m ${pad(s % 60)} s`;
});
</script>

<style>
.light-day-countdown {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
