# PRISM Mobile Deployment Guide

## Prerequisites

### iOS (TestFlight)
1. Apple Developer Program membership ($99/year) — enroll at developer.apple.com
2. Create an App ID in Apple Developer portal:
   - Bundle ID: `com.prism.app`
   - Enable: Push Notifications, Associated Domains
3. Create an App Store Connect app:
   - Name: PRISM — Community Perspectives
   - Bundle ID: com.prism.app
   - SKU: prism-app-001
4. Generate App Store Connect API key for EAS Submit

### Android (Internal Testing)
1. Google Play Developer account ($25 one-time)
2. Create app in Google Play Console:
   - Package name: `com.prism.app`
   - Default language: English (US)
3. Create a service account for EAS Submit
4. Download service account JSON key

## Build Commands

### Development Build (with dev client)
```bash
cd mobile
npx eas-cli build --profile development --platform ios
npx eas-cli build --profile development --platform android
```

### Preview Build (internal distribution)
```bash
npx eas-cli build --profile preview --platform ios    # generates IPA
npx eas-cli build --profile preview --platform android # generates APK
```

### Production Build
```bash
npx eas-cli build --profile production --platform ios
npx eas-cli build --profile production --platform android
```

## TestFlight Distribution

After a successful iOS production build:
```bash
npx eas-cli submit --platform ios --profile production
```

This uploads the build to App Store Connect. Then:
1. Go to App Store Connect > TestFlight
2. The build will appear after processing (5-30 min)
3. Add internal testers (up to 100)
4. Share the TestFlight link

## Android Internal Testing

After a successful Android production build:
```bash
npx eas-cli submit --platform android --profile production
```

This uploads to Google Play Console. Then:
1. Go to Google Play Console > Internal Testing
2. Create a new release with the uploaded build
3. Add testers via email or Google Groups
4. Share the opt-in URL

## Environment Variables

Set these in EAS Secrets:
```bash
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://bkmutmhahravmpfcpbvw.supabase.co"
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_MAPBOX_TOKEN --value "your-mapbox-token"
```

## EAS Project Setup

```bash
cd mobile
npm install
npx eas-cli init  # links to expo.dev project
npx eas-cli build:configure  # generates eas.json if needed
```

## Quick Start Checklist

- [ ] `npm install` in mobile/
- [ ] `npx eas-cli login` — authenticate with Expo
- [ ] `npx eas-cli init` — create/link project
- [ ] Set EAS secrets (env vars above)
- [ ] Update app.json `extra.eas.projectId` with the project ID
- [ ] Update eas.json submit section with Apple/Google credentials
- [ ] Run first build: `npx eas-cli build --profile preview --platform all`
