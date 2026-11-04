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
  characterFailed(error) { globalThis.__exportGltfFailure = error; },
};
