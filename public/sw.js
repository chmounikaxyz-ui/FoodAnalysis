// NutriSnap Service Worker — handles water reminder notification actions

self.addEventListener("notificationclick", (event) => {
  const { action, notification } = event;
  const { data } = notification;

  notification.close();

  if (action === "drink") {
    // Log water by posting a message to all open app windows
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Send message to app to log the water amount
        for (const client of clientList) {
          client.postMessage({
            type: "WATER_LOGGED",
            amount: data?.amount || 250,
            alarmId: data?.alarmId,
          });
        }
        // If no window is open, open the app
        if (clientList.length === 0) {
          return clients.openWindow("/water");
        }
        // Focus existing window
        const focused = clientList.find((c) => c.focused);
        if (focused) return focused.focus();
        return clientList[0].focus();
      })
    );
  } else if (action === "skip") {
    // Do nothing, just close
  } else {
    // Clicked the notification body — focus or open app
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) return clientList[0].focus();
        return clients.openWindow("/water");
      })
    );
  }
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));
