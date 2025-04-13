// test/setup.ts

// ✅ Always import React Native first so we can mock it properly
import * as ReactNative from "react-native"
import mockFile from "./mockFile"

// ✅ Extend and mock parts of React Native
jest.doMock("react-native", () => {
  return Object.setPrototypeOf(
    {
      Image: {
        ...ReactNative.Image,
        resolveAssetSource: jest.fn((_source) => mockFile),
        getSize: jest.fn((_uri, success, _failure) => success(100, 100)),
      },
    },
    ReactNative,
  )
})

// ✅ Translation map for mocking `translate` and `t` functions
const translations: Record<string, string> = {
  // Login Screen
  "loginScreen:logIn": "Log In",
  "loginScreen:createAccount": "Create Account",
  "loginScreen:enterDetails": "Enter your details below",
  "loginScreen:emailFieldLabel": "Email",
  "loginScreen:emailFieldPlaceholder": "Email",
  "loginScreen:passwordFieldLabel": "Password",
  "loginScreen:passwordFieldPlaceholder": "Password",
  "loginScreen:tapToLogIn": "Log In",
  "loginScreen:loginError": "Please enter a valid email and password.",
  "loginScreen:networkError": "A network error occurred. Please try again.",

  // Other Screens
  "userRoutesScreen:title": "Routes",
  "userRewardsScreen:title": "Rewards",
  "userProfileScreen:title": "User Profile",
  "signUpScreen:title": "Sign Up",
  "accountScreen:title": "Account",
  "preferenceScreen:title": "Preferences",
  "exploreMapScreen:title": "Explore Map",
}

const translate = (key: string) => translations[key] || key

// ✅ Mock common i18n libraries
jest.mock("i18next", () => ({
  currentLocale: "en",
  t: translate,
  translate,
}))

jest.mock("expo-localization", () => ({
  ...jest.requireActual("expo-localization"),
  getLocales: () => [{ languageTag: "en-US", textDirection: "ltr" }],
}))

// ✅ Mock i18n module in your app
jest.mock("../app/i18n/i18n.ts", () => ({
  i18n: {
    isInitialized: true,
    language: "en",
    t: translate,
    numberToCurrency: jest.fn(),
  },
}))

// ✅ Alias-style mocks
jest.mock("@/i18n", () => ({ translate }))
jest.mock("@/i18n/index", () => ({ translate }))
jest.mock("../app/i18n/index.ts", () => ({ translate }))

// ✅ Global testing variable
declare const tron // eslint-disable-line @typescript-eslint/no-unused-vars
declare global {
  let __TEST__: boolean
}
