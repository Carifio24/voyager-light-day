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
import { useTemplateRef, watch } from "vue";
import { Vector3d } from "@wwtelescope/engine";
import { SolarSystemObjects } from "@wwtelescope/engine-types";
import { engineStore } from '@wwtelescope/engine-pinia';

import { bodyCenterInScene } from "../horizons/orbitLine";

interface WWTEngineStore extends ReturnType<typeof engineStore> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $wwt?: any;
}

interface WWTTrackedContentProps {
  position: Vector3d;
  offsetX?: number;
  offsetY?: number;
  visible?: boolean;
  frame?: SolarSystemObjects;
  store: WWTEngineStore;
}

const props = withDefaults(defineProps<WWTTrackedContentProps>(), {
  visible: true,
  offsetX: 0,
  offsetY: 0,
  frame: SolarSystemObjects.sun,
});

const parent = useTemplateRef("parent");

function updateVisibility(visible: boolean) {
  const element = parent.value;
  if (element) {
    element.style.visibility = visible ? "visible": "hidden";
  }
}

watch(() => props.visible, updateVisibility);

watch(() => [props.position, props.offsetX, props.offsetY, props.frame] as [Vector3d, number, number,
SolarSystemObjects], ([newPosition, newOffsetX, newOffsetY, newFrame]: [Vector3d, number,
number, SolarSystemObjects]) => {

  const element = parent.value;
  if (!element) {
    return;
  }

  const center = bodyCenterInScene(newFrame);
  const position = Vector3d.create(newPosition.x + center.x, newPosition.y + center.z, newPosition.z + center.y);
  const screenPoint = props.store.findScreenPointForCoordinates(position);
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
