# dswFrontend

## Development Setup

### 1. Start the Backend First

Before running the frontend, you need to set up and start the backend:

1. Clone the backend repository:
   ```bash
   git clone git@github.com:ASE-group10/dsw-backend.git
   ```
2. Navigate to the backend directory:
   ```bash
   cd dsw-backend
   ```
3. Pull the latest changes:
   ```bash
   git pull
   ```
4. Initialize and update submodules:
   ```bash
   git submodule init
   git submodule update
   ```
5. Ensure you have Docker installed, then start the backend services:
   ```bash
   docker compose up -d
   ```

### 2. Setup the Frontend

Once the backend is up and running, follow these steps to set up the frontend:

1. **Create a `.env` file** in the root directory and add your Google API key:
   ```env
   MAPS_API_KEY=your_google_api_key_here
   ```
   - Get the API key from [Google Cloud Platform](https://console.cloud.google.com/) under the **Maps SDK for Android & iOS**.

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Run the app on Android**:
   ```bash
   yarn android
   ```

---

## Acknowledgments

- **[Ignite React Native Boilerplate](https://github.com/infinitered/ignite)** - Used as the base for this project.
- **[Infinite Red](https://infinite.red/)** - For creating and maintaining the Ignite CLI.

---

