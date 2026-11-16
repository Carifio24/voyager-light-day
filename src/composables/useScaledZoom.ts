import { computed, ref } from "vue";
import { WWTControl } from "@wwtelescope/engine";
import { engineStore } from "@wwtelescope/engine-pinia";

export function useScaledZoom() {
  const store = engineStore();

  // WWT's solar-system camera sits 4 * zoom / 9 AU from its target
  const DEFAULT_MIN_ZOOM = 0.00006; // ~4,000 km
  const zoomMin = ref(DEFAULT_MIN_ZOOM); // the usual floor, ~4,000 km
  const zoomMax = ref(2400);
  WWTControl.singleton.setSolarSystemMinZoom(zoomMin.value);
  WWTControl.singleton.setSolarSystemMaxZoom(zoomMax.value);
  
  const logZoomMin = computed(() => Math.log(zoomMin.value));
  const logZoomMax = computed(() => Math.log(zoomMax.value));
  const ZOOM_POWER = 3.5; // Power < 1 stretches the small-fov (zoomed-in) end of the slider.

  // Map linear slider position [0,1] → stretched slider position [0,1].
  const stretchSlider = (t: number) => Math.pow(t, ZOOM_POWER);
  // Inverse: stretched slider position → linear slider position.
  const unstretchSlider = (t: number) => Math.pow(t, 1 / ZOOM_POWER);

  function fovToSlider(fov: number): number {
    const linear = (Math.log(fov) - logZoomMin.value) / (logZoomMax.value - logZoomMin.value);
    return unstretchSlider(Math.max(linear, 0));
  }
  function sliderToFov(t: number): number {
    return Math.exp(logZoomMin.value + stretchSlider(t) * (logZoomMax.value - logZoomMin.value));
  }

  const zoomSliderValue = computed(() => fovToSlider(store.zoomDeg));

  /** set the zoom directly, within the current floor and ZOOM_MAX */
  function setZoom(zoom: number): number {
    const control = WWTControl.singleton;
    const clamped = Math.min(Math.max(zoom, zoomMin.value), zoomMax.value);
    control.renderContext.targetCamera.zoom = clamped;
    control.renderContext.viewCamera.zoom = clamped;
    control.renderOneFrame();
    return clamped;
  }

  function onZoomSlider(e: Event) {
    const input = e.target as HTMLInputElement;
    const zoom = setZoom(sliderToFov(+input.value));
    // past the floor the zoom doesn't change, so nothing re-renders the thumb back to it
    input.value = `${fovToSlider(zoom)}`;
  }

  // the camera's zoom now: store.zoomDeg only catches up on WWT's next frame (and is 0 before the first)
  const currentZoom = () => WWTControl.singleton.renderContext.viewCamera.zoom;

  function zoomIn() {
    setZoom(currentZoom() / 1.25);
  }

  function zoomOut() {
    setZoom(currentZoom() * 1.25);
  }

  // /** lower WWT's floor to ZOOM_MIN_CLOSE, or put it back (pulling the camera out if it's closer than that) */
  // function allowCloseZoom(allow: boolean) {
  //   floor = allow ? ZOOM_MIN_CLOSE : zoomMin;
  //   WWTControl.singleton.setSolarSystemMinZoom(floor);
  //   // WWT only re-clamps the zoom when the view mode changes
  //   if (currentZoom() < floor) {
  //     setZoom(floor);
  //   }
  // }
  
  function setZoomMax(max: number) {
    zoomMax.value = max;
    WWTControl.singleton.setSolarSystemMaxZoom(zoomMax.value);
    setZoom(currentZoom());
  }
  
  function setZoomMin(min: number | null) {
    zoomMin.value = min ?? DEFAULT_MIN_ZOOM;
    WWTControl.singleton.setSolarSystemMinZoom(zoomMin.value);
    setZoom(currentZoom());
  }

  return {
    zoomSliderValue,
    onZoomSlider,
    zoomMax,
    zoomIn,
    zoomOut,
    setZoomMax,
    setZoomMin,
  };
}
