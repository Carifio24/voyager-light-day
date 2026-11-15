<template>
  <div class="selected-info-tour voyager-event">
    <!-- our own header rather than the toolkit's show-close, whose icon
         floats over the corner and so over the scrollbar. This row stays
         put and only the body below it scrolls. -->
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
      </p>
      <figure>
        <img
          :src="image"
          :alt="title"
        />
        <figcaption class="event-credit">{{ imageLabel }}</figcaption>
      </figure>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  image: string;
  imageLabel: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<style lang="less">
.voyager-event {
  // A fixed-shape frame with the whole image fitted inside, rather than a
  // full-width strip cropped to fill. The strip's shape followed the screen, and
  // cropping a tall image like the Earth/Moon one to it left only the black gap
  // between them. Almost every image is on a black sky, so the frame's black
  // fill blends in.
  // The width cap rather than a max-height is what keeps the frame 4:3: a
  // max-height would leave the width at 100% and stretch the frame wide on
  // short screens. 40vh wide at 4:3 is 30vh tall.
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

/* phones (the drawer at the bottom): a smaller tour, the image beside the text so both show */
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
