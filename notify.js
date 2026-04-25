const admin = require('firebase-admin');

// Service Account JSON içeriğini GitHub Secrets üzerinden alacağız
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

async function runNotificationCheck() {
  console.log('--- Rezervasyon Kontrolü Başladı ---');
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  console.log('Bugün:', today);

  try {
    // 1. Tüm kullanıcıları getir
    const usersSnap = await db.collection('users').get();
    
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;
      const userId = userDoc.id;
      const reservations = userData.res || [];

      if (!fcmToken) {
        console.log(`Kullanıcı ${userId} için FCM Token bulunamadı, geçiliyor.`);
        continue;
      }

      // Kullanıcının rezervasyonlarını kontrol et
      const todayReservations = reservations.filter(r => r.startDate === today && !r.completed);

      if (todayReservations.length > 0) {
        console.log(`${userId} için ${todayReservations.length} rezervasyon bulundu. Bildirim gönderiliyor...`);
        
        for (const res of todayReservations) {
          const message = {
            notification: {
              title: 'Rezervasyon Hatırlatıcı ✈️',
              body: `Bugün bir rezervasyonunuz var: ${res.name}`,
            },
            token: fcmToken
          };

          try {
            const response = await messaging.send(message);
            console.log('Bildirim gönderildi:', response);
          } catch (error) {
            console.error('Bildirim gönderilirken hata:', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Genel hata:', error);
  }
  
  console.log('--- Kontrol Tamamlandı ---');
}

runNotificationCheck();
