const SHELL_CACHE = "shell-cache-v1";
const AUDIO_CACHE = "audio-cache-v1";
const SHELL_FILES = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  const isAudio = /\.(mp3|ogg|wav|m4a|flac|aac)$/i.test(url);

  if (isAudio) {
    // Кеш-приоритет для аудио: если файл уже скачан — играем офлайн
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          cache.put(event.request, response.clone());
          return response;
        } catch (e) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Для остального (HTML/JS/API) — сначала сеть, если нет — кеш
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
