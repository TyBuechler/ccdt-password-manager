# CCDT Password Manager

**CSci 411 Group Project** — Cole Thesing, Connor Chandler, David Bull, Ty Buechler

A secure, client/server password management application built with Angular and Firebase.

## Tech Stack
- **Frontend:** Angular 21, SCSS
- **Backend:** Google Firebase (Auth + Firestore)
- **Language:** TypeScript / Java (server-side validation)

## Features
- User registration & login with timed lockout (5 attempts → 15 min)
- Encrypted credential storage
- Random password generator
- Password strength checker
- Tags & folder organization
- Search & filter credentials
- Copy username and password to clipboard
- Audit log dashboard
- Feedback submission
- FAQ page

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Firebase
Edit `src/environments/environment.ts` with your Firebase project credentials:
```ts
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    ...
  }
};
```

### 3. Run locally
```bash
npm start
# Visit http://localhost:4200
```

### 4. Build for production
```bash
npm run build
```

## Security Design
See project step documents for full security design including:
- Least privilege & fail-safe defaults
- Input validation with whitelisting
- NoSQL injection prevention
- XSS mitigation via Angular encoding + CSP headers
- BCrypt password hashing
- No hardcoded credentials

## Firebase Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/credentials/{credId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/auditLogs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/folders/{folderId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /feedback/{docId} {
      allow create: if request.auth != null;
      allow read: if false;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
