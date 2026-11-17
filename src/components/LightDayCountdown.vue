<template>
  <!-- the slot gets the time to or since the target, and whether it's past, for wording that changes then -->
  <!-- Not slot fallback content: Vue shows that whenever the slot renders nothing, as a v-if'd one does -->
  <slot
    v-if="$slots.default"
    :time="time"
    :past="past"
  />
  <span
    v-else
    class="light-day-countdown"
  >{{ past ? "Now!" : time }}</span>
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

// seconds to the target: negative once it's past
const seconds = computed(() => Math.floor((props.target.getTime() - now.value) / 1000));
const past = computed(() => seconds.value <= 0);

/** the time to the target, or since it once past, as "1 d 02 h 03 m 04 s" */
const time = computed(() => {
  const s = Math.abs(seconds.value);
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
