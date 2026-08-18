# Firebase setup for the 90-Day Transformation app

1. Create a Firebase project and add a Web App.
2. Copy the Firebase Web App configuration into `js/auth-config.js`.
3. Firebase Console -> Authentication -> Sign-in method:
   - Enable **Email/Password**.
   - Enable **Phone** if you want mobile OTP.
4. Authentication -> Settings -> Authorized domains:
   - Add your GitHub Pages host, for example `YOUR_USERNAME.github.io`.
5. Create a Cloud Firestore database.
6. Publish the rules below.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Where you can see users

- Firebase Console -> Authentication -> Users: registered login accounts.
- Firebase Console -> Firestore Database -> `users`: profile details submitted after authentication.

## App flow

Login / Sign Up -> verification (email link or phone OTP) -> details form -> app.
The workout streak begins at the user's `firstLoginDate`, stored in Firestore.
