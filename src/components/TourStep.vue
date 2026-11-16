<template>
  <div class="selected-info-tour voyager-event">
    <div class="voyager-event-header">
      <h3>{{ title }}</h3>
      <v-btn
        class="tour-close-button"
        icon="mdi-close"
        variant="text"
        density="compact"
        aria-label="Close tour"
        @click="emit('close')"
      />
    </div>
    <div class="voyager-event-body">
      <p
        v-if="subtitle"
        class="event-date"
      >
        {{ subtitle }}
        <v-btn
          icon="mdi-arrow-right-circle"
          variant="text"
          density="compact"
          size="small"
          aria-label="Go to this step's view"
          @click="emit('go-to-view')"
        />
      </p>
      <figure>
        <img
          :src="image"
          :alt="title"
        />
        <figcaption class="event-credit">
          <a
            v-if="imageUrl"
            :href="imageUrl"
            target="_blank"
            rel="noopener noreferrer"
          >{{ imageLabel }}</a>
          <template v-else>{{ imageLabel }}</template>
        </figcaption>
      </figure>
      <slot />
      <p
        v-if="pdsUrl || opusUrl"
        class="event-credit event-links"
      >
        <a
          v-if="pdsUrl"
          :href="pdsUrl"
          target="_blank"
          rel="noopener noreferrer"
        >PDS</a>
        <template v-if="pdsUrl && opusUrl"> · </template>
        <a
          v-if="opusUrl"
          :href="opusUrl"
          target="_blank"
          rel="noopener noreferrer"
        >OPUS</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  image: string;
  imageLabel: string;
  imageUrl?: string;
  pdsUrl?: string;
  opusUrl?: string;
}>();

const emit = defineEmits<{
  close: [];
  "go-to-view": [];
}>();
</script>

<style lang="less">
.voyager-event {
  img {
    display: block;
    width: min(100%, 40vh);
    margin-inline: auto;
    aspect-ratio: 4 / 3;
    object-fit: contain;
    background: black;
    border-radius: 4px;
  }

  .event-date,
  .event-credit {
    font-size: 0.85em;
    opacity: 0.8;
  }
}

.tour-sheet .voyager-event {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.voyager-event-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  flex: none;
}

.voyager-event-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.voyager-event figure {
  margin: 0;
}

.voyager-event .event-links {
  clear: both;
}

.drawer-bottom {
  .voyager-event {
    font-size: 0.875em;
  }

  .voyager-event-header h3 {
    font-size: 1.05em;
  }

  .tour-close-button {
    width: 24px;
    height: 24px;
  }

  .voyager-event figure {
    float: left;
    width: 40%;
    margin: 0 0.5em 0.25em 0;

    img {
      width: 100%;
    }
  }
}
</style>
