// ตั้งชื่อ Cache (ถ้ามีการอัปเดตระบบครั้งใหญ่ๆ ในอนาคต ให้มาเปลี่ยนเลข v2 เป็น v3, v4 ได้ครับ)
const CACHE_NAME = 'kaosu-packing-v2';

// 1. Install Event: บังคับให้ Service Worker ตัวใหม่ทำงานทันที ไม่ต้องรอ
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Activate Event: เคลียร์ Cache ตัวเก่าทิ้ง เพื่อไม่ให้เครื่องจำหน้าเว็บเก่า
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('ลบ Cache เก่า:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event (Network-First Strategy)
// ดึงข้อมูลจาก GitHub ล่าสุดก่อนเสมอ -> ถ้าเน็ตหลุด ค่อยเอา Cache เก่ามาโชว์
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return; // ไม่ยุ่งกับ POST (เช่นตอนส่งข้อมูลเข้าชีท)

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // ถ้าต่อเน็ตได้ ให้เซฟไฟล์ล่าสุดลง Cache ด้วย
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // ถ้าเน็ตหลุด ให้ดึงไฟล์เก่าจาก Cache มาแสดง
        return caches.match(event.request);
      })
  );
});
