if (typeof window !== 'undefined') {
  try {
    const origFetch = window.fetch;
    let currentFetch = origFetch;
    Object.defineProperty(window, 'fetch', {
      get: function () {
        return currentFetch;
      },
      set: function (val) {
        currentFetch = val;
      },
      configurable: true,
      enumerable: true,
    });
  } catch (e) {
    // Ignore if already patched or not configurable
  }
}

export {};
