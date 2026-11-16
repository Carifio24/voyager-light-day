<template>
  <div
    ref="parent"
    class="wwt-tracked-content"
  >
    <slot>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from "vue";
import type { Vector3d } from "@wwtelescope/engine";
import { engineStore } from '@wwtelescope/engine-pinia';

interface WWTEngineStore extends ReturnType<typeof engineStore> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $wwt?: any;
}

interface WWTTrackedContentProps {
  position: Vector3d;
  offsetX?: number;
  offsetY?: number;
  visible?: boolean;
  store: WWTEngineStore;
}

const props = withDefaults(defineProps<WWTTrackedContentProps>(), {
  visible: true,
  offsetX: 0,
  offsetY: 0,
});

const parent = useTemplateRef("parent");

function updateVisibility(visible: boolean) {
  const element = parent.value;
  if (element) {
    element.style.visibility = visible ? "visible": "hidden";
  }
}

watch(() => props.visible, updateVisibility);

watch(() => [props.position, props.offsetX, props.offsetY] as [Vector3d, number, number], ([newPosition, newOffsetX, newOffsetY]: [Vector3d, number,
number]) => {

  const element = parent.value;
  if (!element) {
    return;
  }

  const screenPoint = props.store.findScreenPointForCoordinates(newPosition);
  screenPoint.x += newOffsetX;
  screenPoint.y += newOffsetY;

  element.style.left = `${screenPoint.x}px`;
  element.style.top= `${screenPoint.y}px`;
});
</script>

<style lang="less">
.wwt-tracked-content {
  pointer-events: auto;
  user-select: none;
  cursor: pointer;
  position: absolute;
  transform-origin: center center;
}
</style>
