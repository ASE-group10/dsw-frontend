# dswFrontend

## Development Setup

### 1. Configure the Backend URLs

Before running the frontend, you need to make sure the API URLs in the config point to the correct backend services. Open the file:

```bash
app/config/config.dev.ts
```

And update the URLs to point to your backend:

```ts
export default {
  USER_API_URL: "https://your-backend-url.com/service4",
  ROUTE_API_URL: "https://your-backend-url.com/service1",
  REWARD_API_URL: "https://your-backend-url.com/service5",
  // You can also use local network IPs if running the backend locally:
  // USER_API_URL: "http://10.0.2.2:8083",
  // ROUTE_API_URL: "http://10.0.2.2:8080",
  // REWARD_API_URL: "http://10.0.2.2:8084",
}
```

> 🚫 **Do not include API secrets in this file or anywhere in your JS.**

---

### 2. Setup the Frontend

1. **Create a `.env` file** in the project root and insert your Google Maps API key:

   ```env
   MAPS_API_KEY=your_google_api_key_here
   ```

   You can obtain this from the [Google Cloud Console](https://console.cloud.google.com/) under the **Maps SDK for Android & iOS** section.

2. **Install dependencies**:

   ```bash
   yarn install
   ```

3. **Run the app on Android**:

   ```bash
   yarn android
   ```

---

### 3. Building the APK (Production)

To build a production APK:

1. Set up your [EAS account](https://docs.expo.dev/eas/).
2. Log in with EAS:

   ```bash
   npx eas login
   ```

3. Then run the production build:

   ```bash
   yarn build:android:prod
   ```

---

## Acknowledgments

- **[Ignite React Native Boilerplate](https://github.com/infinitered/ignite)** - Base of the project.
- **[Infinite Red](https://infinite.red/)** - Creators of the Ignite CLI.
