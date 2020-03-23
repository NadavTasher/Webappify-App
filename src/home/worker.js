/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/BaseTemplate/
 **/

const CACHE_NAME = "offline";
const CACHE_FILE = "offline.html";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            fetch("resources/" + CACHE_FILE).then((response) => {
                cache.put(CACHE_FILE, response).then();
            });
        })
    );
});

self.addEventListener("fetch", function (event) {
    event.request.cache = "no-store";
    event.respondWith(fetch(event.request).then(response => response).catch(() => caches.match(new Request(CACHE_FILE)) || new Response("Offline")));
});