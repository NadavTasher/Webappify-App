self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open('v1').then(function (cache) {
            fetch("resources/offline.html").then((response) => {
                cache.put("offline.html", response);
            });
        })
    );
});
self.addEventListener('fetch', function (event) {
    event.request.cache = "no-store";
    event.respondWith(
        fetch(event.request).then(function (fetchResponse) {
            return fetchResponse;
        }).catch(function () {
            return caches.match(new Request("offline.html")) || new Response("Offline");
        })
    );
});