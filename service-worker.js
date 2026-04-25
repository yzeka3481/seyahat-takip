importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDiZ7KZBF1bPb185duB0iIXvtqrdfJ91e8",
    authDomain: "seyahat-takip.firebaseapp.com",
    projectId: "seyahat-takip",
    storageBucket: "seyahat-takip.firebasestorage.app",
    messagingSenderId: "740530417306",
    appId: "1:740530417306:web:62b1538f1f85fa9e8c7923",
    measurementId: "G-68BX89MR14"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Arka plan mesaj dinleyicisi
messaging.onBackgroundMessage((payload) => {
  console.log('Arka planda mesaj alındı:', payload);
  const notificationTitle = payload.notification.title || 'TripLedger Hatırlatıcı';
  const notificationOptions = {
    body: payload.notification.body,
    icon: './app-icon.png',
    badge: './app-icon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

const CACHE_NAME = 'tripledger-v1';
const ASSETS = [
  './index.html',
  './app-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('./');
    })
  );
});
