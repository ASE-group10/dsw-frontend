# dswFrontend

## Description

This project contains the frontend application for the **Distributed System Wayfinding (DSW)** application. It is built using **React Native**, **TypeScript**, and the **Ignite boilerplate**, providing users with an intuitive interface for sustainable and dynamic wayfinding.

The Ignite boilerplate helps structure the project with best practices, ensuring scalability, maintainability, and a smooth development experience. The app includes **React Navigation**, **MobX State Tree**, and other modern React Native tools.

---

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [Acknowledgments](#acknowledgments)

---

## Installation

### Prerequisites

Before setting up the project, ensure you have the following installed on your machine:

1. **Node.js**: The latest LTS version from [Node.js](https://nodejs.org/).
2. **Yarn**: Package manager for faster and more reliable builds. Install it globally:
   ```bash
   npm install -g yarn
   ```
3. **Watchman (macOS/Linux)**: File-watching service (only required on macOS/Linux):
   ```bash
   brew install watchman
   ```
4. **Ignite CLI**: Install for React Native commands:
   ```bash
   yarn add ignite-cli
   ```
5. **Java 17**: Required for Android development. Download and install Java 17 from the [AdoptOpenJDK website](https://adoptium.net/) or use an installer like `sdkman`:
   ```bash
   sdk install java 17-open
   ```
6. **Xcode (macOS)**: For iOS development, install via the [App Store](https://apps.apple.com/us/app/xcode/id497799835?mt=12). Set up command-line tools with:
   ```bash
   sudo xcode-select --install
   ```
7. **Android Studio**: For Android development, download and configure the [Android SDK](https://developer.android.com/studio).

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ASE-group10/dsw-frontend.git
   cd dsw-frontend
   ```

2. **Install dependencies**:
   This will install all the dependencies defined in `yarn.lock`:
   ```bash
   yarn install
   ```

3. **Set up Ignite and validate**:
   Ignite CLI helps you manage your React Native setup. Run the following to validate your environment:
   ```bash
   yarn ignite doctor
   ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory if necessary and add any required environment variables (e.g., API keys).
   

---

## Usage

### Running on Android

1. **Start the Metro Bundler**:
   ```bash
   yarn start
   ```
   This will start the React Native Metro bundler, which handles JavaScript code and asset bundling.

2. **Run the app on an Android device or emulator**:
   ```bash
   yarn android
   ```

   - For **physical Android devices**:
     - Enable **USB Debugging** on your Android device.
     - Connect your device via USB.
   - For **Android emulators**:
     - Open **Android Studio**.
     - Navigate to **AVD Manager** and start an emulator.

### Running on iOS (macOS only)

1. **Install CocoaPods dependencies**:
   Navigate to the `ios` directory and install dependencies:
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Run the app on iOS simulator**:
   ```bash
   yarn ios
   ```

   Ensure the **iOS simulator** is running, or use:
   ```bash
   open -a Simulator
   ```

---

## Project Structure

The Ignite boilerplate organizes your project in a structured and scalable way:

```
ignite-project
├── app
│   ├── components
│   ├── config
│   ├── i18n
│   ├── models
│   ├── navigators
│   ├── screens
│   ├── services
│   ├── theme
│   ├── utils
│   └── app.tsx
├── assets
│   ├── icons
│   └── images
├── test
│   ├── __snapshots__
│   ├── mockFile.ts
│   └── setup.ts
├── ignite
│   └── templates
│       ├── app-icon
│       ├── component
│       ├── model
│       ├── navigator
│       └── screen
├── index.js
├── android
│   ├── app
│   ├── build.gradle
│   ├── gradle
│   ├── gradle.properties
│   ├── gradlew
│   ├── gradlew.bat
│   ├── keystores
│   └── settings.gradle
├── ios
│   ├── IgniteProject
│   ├── IgniteProject-tvOS
│   ├── IgniteProject-tvOSTests
│   ├── IgniteProject.xcodeproj
│   └── IgniteProjectTests
├── .env
└── package.json
```

### Key Directories

- **app**: Contains the core logic and structure of your app.
  - **components**: Reusable UI components used across different screens.
  - **config**: Stores configuration files, such as environment-specific settings.
  - **i18n**: Translations and internationalization.
  - **models**: Contains your app's **MobX-State-Tree (MST)** models.
  - **navigators**: React Navigation setup and screen navigators.
  - **screens**: Full-screen components that are part of the app's navigation structure.
  - **services**: External services (e.g., REST APIs, push notifications).
  - **theme**: Shared styles (colors, spacing, typography).
  - **utils**: Miscellaneous helper functions and utilities.

- **assets**: Stores images, icons, and other assets used throughout the app.
  - **icons**: Reusable icon components (e.g., for buttons, navigation).
  - **images**: Image assets like logos, backgrounds, etc.

- **ignite**: Custom Ignite templates for components, models, screens, and more.
  
- **test**: Unit tests and snapshot tests for the app.

---

## Development

### Available Scripts

- **`yarn start`**: Starts the Metro bundler for React Native.
- **`yarn android`**: Builds and runs the app on an Android device or emulator.
- **`yarn ios`**: Builds and runs the app on an iOS device or simulator (macOS only).
- **`yarn test`**: Runs unit tests using Jest.
- **`yarn lint`**: Lints the codebase with ESLint.

### Project Guidelines

- **Components**: Use components for reusable UI elements.
- **Models**: Define app state using MobX-State-Tree (MST). Create models to structure your data and actions.
- **Navigation**: Use **React Navigation** for screen transitions. Organize navigators under the `navigators` directory.
- **Styling**: Use a shared **theme** for consistent styling (colors, typography, etc.).

### Coding Standards

- **Commit Messages**: Use clear and descriptive commit messages.
- **Branching**:
- **`main`**: Stable, production-ready code.
- **`feature/*`**: Feature development.
  - Example: `feature/user-authentication`
- **`bugfix/*`**: Fixes for known bugs.
  - Example: `bugfix/login-error`
- **`release/*`**: Release preparation and testing.
  - Example: `release/1.2.0`
- **`chore/*`**: Maintenance tasks like dependency updates or refactoring.
  - Example: `chore/update-dependencies`
- **`docs/*`**: Documentation updates.
  - Example: `docs/update-readme`
- **`refactor/*`**: Codebase restructuring or optimizations.
  - Example: `refactor/improve-auth-module`
    
---

## Acknowledgments

- **[Ignite React Native Boilerplate](https://github.com/infinitered/ignite)** - Used as the base for this project.
- **[Infinite Red](https://infinite.red/)** - For creating and maintaining the Ignite CLI.

---
