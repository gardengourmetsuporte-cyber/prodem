// Push notification handler - imported by Workbox service worker
// This file handles push events and notification clicks

self.addEventListener('push', function(event) {
  console.log('[Push-SW] Push event received!', event);
  
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('[Push-SW] Error parsing push data:', e);
    try {
      data = { title: 'Prodem Gestão', body: event.data ? event.data.text() : 'Nova notificação' };
    } catch (e2) {
      data = { title: 'Prodem Gestão', body: 'Nova notificação' };
    }
  }
  
  console.log('[Push-SW] Push data:', JSON.stringify(data));
  
  const title = data.title || 'Prodem Gestão';
  const options = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: data.url || '/' },
    // iOS Safari is stricter with advanced options; keep a minimal, compatible set
    tag: data.tag || 'default',
    renotify: false,
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(function() {
        console.log('[Push-SW] Notification shown successfully');
      })
      .catch(function(err) {
        console.error('[Push-SW] Failed to show notification:', err);
      })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Push-SW] Notification clicked, action:', event.action);
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Force activate new service worker immediately
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Push-SW] Skipping waiting, activating new version');
    self.skipWaiting();
  }
});

// Log that push-sw.js was loaded successfully
console.log('[Push-SW] Push notification handler loaded successfully v3 (sound enabled)');
