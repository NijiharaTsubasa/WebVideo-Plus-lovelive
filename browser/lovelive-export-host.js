globalThis.__webgalOfflineExportHost = {
  register(bindings) {
    globalThis.__wgProbe = { ...bindings, adapter: { id: 'lovelive' } };
    globalThis.__nativeAdapterInstalled = true;
  },
  commands(handlers) { globalThis.__probeCommands = handlers; },
  observe(sentence) { globalThis.__nativeObserve?.(sentence); },
  beforeNext() { return globalThis.__nativeBeforeNext?.() !== false; },
  scheduleAuto(callback, delay) { return (globalThis.__nativeScheduleAuto ?? setTimeout)(callback, delay); },
  scheduleAssetMount(callback) { __pwClock.controller._embedder.setTimeout(callback, 0); },
  // GPU preparation waits use wall time; dialogue and animation timers stay virtual.
  scheduleResourceTask(callback, delay) { return __pwClock.controller._embedder.setTimeout(callback, delay); },
  characterFailed(error) { globalThis.__exportGltfFailure = error; },
  shouldRenderGltfFrames() { return !globalThis.__nativePlanning; },
};
