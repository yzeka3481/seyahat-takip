const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

async function runNotificationCheck() {
  console.log('--- Akıllı Rezervasyon Kontrolü Başladı ---');
  
  try {
    const usersSnap = await db.collection('users').get();
    
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;
      const userId = userDoc.id;
      const reservations = userData.res || [];
      const userTz = userData.browserTimezone || 'Europe/Istanbul';

      // Kullanıcının yerel saatini ve tarihini hesapla
      const userNow = new Date();
      const userLocalTimeStr = userNow.toLocaleString('en-US', { timeZone: userTz, hour12: false });
      const userLocalHour = parseInt(userLocalTimeStr.split(', ')[1].split(':')[0]);
      const userLocalDate = new Date(userLocalTimeStr).toISOString().slice(0, 10);

      console.log(`Kullanıcı: ${userId} | Bölge: ${userTz} | Yerel Saat: ${userLocalHour} | Tarih: ${userLocalDate}`);

      // SADECE sabah saat 09:00 ise (veya o saat dilimine yeni girmişse) bildirim gönder
      if (userLocalHour !== 9) {
        console.log(`-> Şu an saat 09:00 değil, geçiliyor.`);
        continue;
      }

      if (!fcmToken) {
        console.log(`-> FCM Token bulunamadı.`);
        continue;
      }

      const todayReservations = reservations.filter(r => r.startDate === userLocalDate && !r.completed);

      if (todayReservations.length > 0) {
        console.log(`-> ${todayReservations.length} rezervasyon bulundu! Bildirim gönderiliyor...`);
        
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
            console.log('Bildirim başarıyla gönderildi:', response);
          } catch (error) {
            console.error('Bildirim hatası:', error);
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
