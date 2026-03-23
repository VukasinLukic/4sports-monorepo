# Push Notifications Setup Guide (Expo + Firebase)

Kompletni vodič za podešavanje push notifikacija u Expo/React Native aplikaciji koristeći **Expo Push API** sa **Firebase Cloud Messaging (FCM V1)** na Androidu.

## Arhitektura

```
Mobile App → getExpoPushTokenAsync() → Expo Push Token (ExponentPushToken[xxx])
                                            ↓
                                    Šalje se na backend → čuva u MongoDB (User.pushToken)
                                            ↓
Backend → HTTP POST → Expo Push API (https://exp.host/--/api/v2/push/send)
                            ↓
                    Expo rutira na FCM (Android) / APNs (iOS)
                            ↓
                    Push notifikacija stiže na uređaj
```

**Zašto Expo Push API a ne direktan FCM?**
- Jednostavniji - jedan API za oba platforme (Android i iOS)
- Ne treba APNs sertifikat za slanje (Expo to handluje)
- Besplatno, održava Expo tim
- Podržava batching do 100 poruka

---

## 1. Firebase projekat

### 1.1 Kreiranje projekta
1. Idi na [Firebase Console](https://console.firebase.google.com)
2. Kreiraj novi projekat ili koristi postojeći

### 1.2 Dodaj Android aplikaciju
1. Project Settings → Your apps → **Add app** → Android
2. Package name: `com.foursports.mobile` (mora da odgovara `android.package` u `app.json`)
3. Skini `google-services.json`

### 1.3 Uključi FCM V1 API
1. Firebase Console → Project Settings → **Cloud Messaging** tab
2. Proveri da je **Firebase Cloud Messaging API (V1)** uključen
3. Ako nije, idi na Google Cloud Console i uključi `fcm.googleapis.com` API:
   ```
   https://console.developers.google.com/apis/api/fcm.googleapis.com/overview?project=YOUR_PROJECT_ID
   ```

---

## 2. EAS / Expo podešavanje

### 2.1 EAS Project ID
U `app.json` mora da postoji EAS project ID:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "tvoj-project-id-ovde"
      }
    }
  }
}
```
Dobija se automatski kad pokreneš `eas init` ili `eas build` prvi put.

### 2.2 google-services.json
U `app.json` pod android sekcijom:
```json
{
  "android": {
    "package": "com.foursports.mobile",
    "googleServicesFile": "./google-services.json"
  }
}
```
Fajl `google-services.json` mora biti u root-u mobile-app foldera.

### 2.3 SHA-1 Fingerprint (VAŽNO!)
EAS build koristi svoj keystore za potpisivanje APK-a. Firebase mora da zna SHA-1 tog keystora.

1. Dobij SHA-1:
   ```bash
   cd mobile-app && eas credentials -p android
   ```
   Izaberi **production** → **Keystore** → tu piše SHA-1 Fingerprint

2. Dodaj u Firebase Console:
   - Project Settings → Your apps → Android app
   - **Add fingerprint** → nalepi SHA-1
   - Sačuvaj

3. **Skini NOVI google-services.json** nakon dodavanja fingerprinta i zameni stari

### 2.4 FCM V1 Service Account Key (KLJUČNI KORAK!)
Expo Push API koristi ovaj ključ da prosledi notifikacije na FCM. Bez njega, Expo vraća `InvalidCredentials` error.

1. Firebase Console → Project Settings → **Service accounts** tab
2. Klikni **Generate new private key** → skini JSON fajl
3. Upload u EAS:
   ```bash
   cd mobile-app && eas credentials -p android
   ```
   Izaberi **production** → **Google Service Account** → **Set up a Google Service Account Key for Push Notifications (FCM V1)** → daj putanju do JSON fajla

### 2.5 expo-notifications plugin
U `app.json`:
```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/mobile_icon.png",
        "color": "#4caf50"
      }
    ]
  ]
}
```

---

## 3. Mobile app kod

### 3.1 Paketi
```bash
npx expo install expo-notifications expo-device expo-constants
npm install @react-native-async-storage/async-storage
```

### 3.2 Token registracija (services/pushNotifications.ts)
Ključni deo - dobijanje Expo Push Tokena:
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return { token: null, error: 'Not a physical device' };
  }

  // Traži permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return { token: null, error: `Permission ${finalStatus}` };
  }

  // Dobij projectId iz app.json → extra.eas.projectId
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId
    ?? (Constants as any).manifest2?.extra?.eas?.projectId;

  if (!projectId) {
    return { token: null, error: 'No projectId' };
  }

  // Dobij Expo Push Token
  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResponse.data; // Format: ExponentPushToken[xxxxx]

  // Podesi Android notification channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return { token, error: null };
}
```

### 3.3 Slanje tokena na backend
```typescript
// POST /chat/fcm-token sa { token: "ExponentPushToken[xxx]" }
await api.post('/chat/fcm-token', { token });
```

### 3.4 Persistencija tokena (AsyncStorage)
Token se čuva u AsyncStorage da ne bi bio izgubljen na restart:
```typescript
const PUSH_TOKEN_KEY = '@push_token';
await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
// Na init, load:
const savedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
```

---

## 4. Backend kod

### 4.1 Čuvanje tokena
Backend prima token od mobilne app i čuva u User modelu:
```typescript
// User model treba da ima: pushToken: String
await User.findByIdAndUpdate(userId, { pushToken: token || null });
```

### 4.2 Slanje push notifikacija (Expo Push API)
```typescript
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const messages = tokens.map(token => ({
  to: token,          // ExponentPushToken[xxx]
  title: 'Naslov',
  body: 'Tekst poruke',
  data: { type: 'chat_message', conversationId: '123' },
  sound: 'default',
  priority: 'high',
}));

const response = await fetch(EXPO_PUSH_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  },
  body: JSON.stringify(messages),
});

const result = await response.json();
// result.data = [{ status: 'ok', id: '...' }]
```

### 4.3 Čišćenje nevažećih tokena
Ako Expo vrati `DeviceNotRegistered` (app je deinstalirana), obriši token:
```typescript
result.data.forEach((receipt, idx) => {
  if (receipt.details?.error === 'DeviceNotRegistered') {
    invalidTokens.push(tokens[idx]);
  }
});
await User.updateMany(
  { pushToken: { $in: invalidTokens } },
  { $unset: { pushToken: '' } }
);
```

---

## 5. Testiranje

### 5.1 Debug info
Dodaj debug info u settings screen da vidiš status:
- Token: `ExponentPushToken[xxx...]` (ili `none` ako nije dobijen)
- Registered: `true/false`
- Error: razlog greške ako postoji

### 5.2 Expo Push Tool
Za ručno testiranje: https://expo.dev/notifications
- Nalepi ExponentPushToken
- Unesi title i body
- Send

### 5.3 Backend logovi
Dodaj logove u push service za debug:
```typescript
console.log(`📱 Push: sending to ${userIds.length} users, found ${users.length} with tokens`);
console.log(`📱 Push API response:`, JSON.stringify(result));
```

---

## 6. Česte greške i rešenja

| Greška | Uzrok | Rešenje |
|--------|-------|---------|
| `IOException / ExecutionException` na uređaju | google-services.json nema SHA-1 ili FCM API nije uključen | Dodaj SHA-1 fingerprint u Firebase, uključi FCM API |
| `InvalidCredentials` iz Expo API | Expo nema FCM server key | Upload Google Service Account JSON u EAS credentials |
| `DeviceNotRegistered` iz Expo API | App deinstalirana sa uređaja | Automatski očisti token iz baze |
| `No projectId` | app.json nema EAS projectId | Pokreni `eas init` ili dodaj ručno |
| `Permission denied/undetermined` | Korisnik nije dozvolio notifikacije | Prikaži UI za ponovno traženje permisije |
| Token je `null` bez greške | Expo Go ili emulator | Push radi samo na fizičkom uređaju sa EAS buildom |

---

## 7. Checklist za novu aplikaciju

- [ ] Firebase projekat kreiran
- [ ] Android app dodata u Firebase (tačan package name)
- [ ] FCM V1 API uključen
- [ ] `google-services.json` skinut i stavljen u projekat
- [ ] `app.json` ima `android.googleServicesFile` i `extra.eas.projectId`
- [ ] `expo-notifications` plugin dodat u `app.json`
- [ ] SHA-1 fingerprint EAS keystora dodat u Firebase Console
- [ ] **Novi** `google-services.json` skinut nakon dodavanja SHA-1
- [ ] Google Service Account JSON uploadovan u EAS credentials (FCM V1)
- [ ] Mobile app dobija ExponentPushToken i šalje na backend
- [ ] Backend čuva token u User modelu
- [ ] Backend šalje push preko Expo Push API
- [ ] APK buildovan i testiran na fizičkom uređaju
