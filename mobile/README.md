# Lifeline Mobile App

React Native mobile application for the Lifeline platform - transform your digital life into a monetizable story.

## Features

✅ **Authentication System**
- Beautiful onboarding experience with gradient UI
- User registration with Creator/Consumer role selection
- Email/password login
- JWT token management with automatic refresh
- Persistent authentication with AsyncStorage
- Email verification support
- Password reset flow (backend ready)

✅ **Stunning UI Design**
- Gradient backgrounds and glassmorphism effects
- Role-specific color themes (Creator: Pink/Red, Consumer: Blue/Cyan)
- Smooth animations and transitions
- Modern, premium design inspired by top social media apps

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Native Stack)
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **HTTP Client**: Axios
- **UI Components**: Custom components with expo-linear-gradient

## Prerequisites

- Node.js >= 18
- npm or yarn
- Expo Go app (for testing on real devices)
- iOS Simulator or Android Emulator

## Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

## Running the App

### On Physical Device
1. Install Expo Go from App Store (iOS) or Play Store (Android)
2. Run `npm start`
3. Scan the QR code with your camera (iOS) or Expo Go app (Android)

### On Emulator
```bash
# iOS (requires macOS)
npm run ios

# Android
npm run android

# Web (limited functionality)
npm run web
```

## Project Structure

```
mobile/
├── App.tsx                  # Main app component with navigation
├── contexts/
│   └── AuthContext.tsx      # Authentication context & API calls
├── screens/
│   ├── WelcomeScreen.tsx    # Onboarding welcome screen
│   ├── LoginScreen.tsx      # Login form
│   ├── RegisterScreen.tsx   # Registration with role selection
│   └── HomeScreen.tsx       # Authenticated home dashboard
├── package.json
└── tsconfig.json
```

## Configuration

### API URL
Update the API URL in `contexts/AuthContext.tsx`:
```typescript
const API_URL = 'http://localhost:3000/api'; // Change to your backend URL
```

For physical devices, use your computer's IP address:
```typescript
const API_URL = 'http://192.168.1.XXX:3000/api';
```

## Features by Screen

### Welcome Screen
- Gradient hero section with app logo
- Feature highlights
- "Get Started" and "Sign In" buttons

### Register Screen
**Step 1: Role Selection**
- Creator role (monetize your story)
- Consumer role (discover stories)
- Beautiful gradient cards with role descriptions

**Step 2: Account Creation**
- First name, last name, email, password fields
- Password confirmation
- Input validation
- Terms of service agreement

### Login Screen
- Email/password authentication
- Password visibility toggle
- "Forgot Password" link
- Social OAuth placeholders (Google, Facebook, Twitter/X)

### Home Screen
- Personalized greeting with user avatar
- Role badge (Creator/Consumer)
- Quick stats dashboard (placeholder for future features)
- Account information card
- "Coming Soon" feature preview
- Sign out button

## Authentication Flow

1. **New User**: Welcome → Register (Role Selection) → Create Account → Email Verification → Login
2. **Existing User**: Welcome → Login → Home
3. **Persistent Session**: App opens directly to Home if logged in

## Token Management

- **Access Token**: Short-lived (15 minutes), stored in memory and AsyncStorage
- **Refresh Token**: Long-lived (7 days), automatically refreshes access token
- **Auto-logout**: If refresh fails, user is logged out

## Styling Guide

### Color Palette
- **Creator Theme**: `#f093fb` → `#f5576c` (Pink to Red gradient)
- **Consumer Theme**: `#4facfe` → `#00f2fe` (Blue to Cyan gradient)
- **Primary Gradient**: `#667eea` → `#764ba2` (Purple gradient)
- **White**: `#FFFFFF`
- **Text**: `#333333`

### Design Patterns
- Border radius: 12-16px for cards, 22-28px for avatars
- Shadow: Subtle shadows for depth
- Glassmorphism: `rgba(255, 255, 255, 0.2)` backgrounds
- Spacing: 12-24px between elements

## Next Steps (Phase 1.2)

- [ ] Forgot Password screen
- [ ] Email verification screen
- [ ] Profile editing screen
- [ ] Avatar upload functionality
- [ ] Social OAuth integration (Google, Facebook, Twitter/X)
- [ ] Onboarding tutorial
- [ ] Push notification setup

## Known Limitations

- Email verification requires manual email checking (no in-app flow yet)
- Avatar upload not implemented (placeholder in backend)
- Social OAuth buttons are UI-only (not functional)
- Stats/metrics are placeholders

## Backend Connection

Make sure the backend API is running on `http://localhost:3000` before testing.
See `../backend/README.md` for backend setup instructions.

## Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator (macOS only)
npm run web        # Run in web browser
```

## Troubleshooting

### "Module not found" errors
```bash
npm install
npx expo install expo-linear-gradient @react-native-async-storage/async-storage
```

### Connection to backend fails
- Ensure backend is running on port 3000
- Use your computer's IP address instead of localhost for physical devices
- Check firewall settings

### Expo Go crashes
- Clear Expo cache: `npx expo start --clear`
- Restart Expo Go app
- Check for TypeScript errors in terminal

## License

MIT
