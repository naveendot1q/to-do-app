# 📱 Todo Mobile App (React Native + Expo)

Same Supabase backend as the web app — fully synced.

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
cd todo-mobile
npm install
```

### 2. Add your Supabase keys
Edit the `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run on your phone (easiest)
```bash
npx expo start
```
- Install **Expo Go** from App Store / Play Store
- Scan the QR code with Expo Go (Android) or Camera (iOS)

---

## 🏗️ Build for Production

### Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Android APK (for testing)
```bash
eas build --platform android --profile preview
```

### iOS (requires Apple Developer account)
```bash
eas build --platform ios --profile production
```

### Both platforms
```bash
eas build --platform all --profile production
```

---

## 🔐 Auth Flow
Same as web app:
1. Email + Password login
2. Microsoft Authenticator TOTP (2FA)
3. First login → scan QR code to enroll
4. Subsequent logins → enter 6-digit code

---

## ✅ Features
- Full todo management (add/edit/delete/complete)
- Date browser — swipe through weeks, tap to filter by day
- Priority sorting (High → Medium → Low)
- Categories, due dates, search
- Pull-to-refresh sync with Supabase
- Real-time data shared with web app
- Secure session storage (SecureStore)

---

## 📁 Structure
```
app/
  _layout.tsx       # Root layout + auth listener
  index.tsx         # Main dashboard
  login/index.tsx   # Login screen
  setup-totp/       # First-time 2FA setup
  verify-totp/      # 2FA verification
components/
  DateBrowser.tsx   # Weekly date strip
  TodoItem.tsx      # Single todo card
  AddTodoSheet.tsx  # Bottom sheet to add todos
lib/
  supabase.ts       # Supabase client (SecureStore)
  types.ts          # TypeScript types
  theme.ts          # Design tokens
```
