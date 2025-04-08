/* eslint-disable import/first */
/**
 * Welcome to the main entry point of the app.
 */
if (__DEV__) {
  require("./devtools/ReactotronConfig.ts")
}
import "./utils/gestureHandler"
import { initI18n } from "./i18n"
import "./utils/ignoreWarnings"
import { useFonts } from "expo-font"
import { useEffect, useState } from "react"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"
import * as Linking from "expo-linking"
import { useInitialRootStore, useStores } from "./models"
import { AppNavigator, useNavigationPersistence } from "./navigators"
import { ErrorBoundary } from "@/screens"
import * as storage from "./utils/storage"
import { customFontsToLoad } from "./theme"
import Config from "./config"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { loadDateFnsLocale } from "./utils/formatDate"
import { apiUser, apiReward } from "./services/api"
import { useThemeProvider } from "@/utils/useAppTheme"

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

// Web linking configuration
const prefix = Linking.createURL("/")
const config = {
  screens: {
    Login: { path: "" },
    Welcome: "welcome",
    Demo: {
      screens: {
        DemoShowroom: { path: "showroom/:queryIndex?/:itemIndex?" },
        DemoDebug: "debug",
        DemoPodcastList: "podcast",
        DemoCommunity: "community",
      },
    },
  },
}

interface AppProps {
  hideSplashScreen: () => Promise<boolean>
}

/**
 * The root component of the app.
 */
function App(props: AppProps) {
  const { hideSplashScreen } = props
  const { initialNavigationState, onNavigationStateChange, isRestored: isNavigationStateRestored } =
    useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY)
  const [areFontsLoaded, fontLoadError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)

  useEffect(() => {
    initI18n().then(() => setIsI18nInitialized(true)).then(() => loadDateFnsLocale())
  }, [])

  const { rootStore, rehydrated } = useInitialRootStore(async () => {
    const { authenticationStore, preferencesStore } = rootStore
    const token = authenticationStore.authToken

    console.log("App initialization token:", token)
    if (token) {
      // Set the token for API requests
      apiUser.apisauce.setHeader("Authorization", `Bearer ${token}`)
      apiReward.apisauce.setHeader("Authorization", `Bearer ${token}`)

      try {
        const response = await apiUser.getAccountInfo()
        if (response.ok) {
          const { name, email, phoneNumber, picture } = response.data
          authenticationStore.setAuthName(name)
          authenticationStore.setAuthEmail(email)
          authenticationStore.setAuthPhoneNumber(phoneNumber)
          authenticationStore.setAuthPicture(picture ?? null)
          await preferencesStore.fetchPreferences()
          console.log("✅ Auth and preferences loaded.")
        } else if (response.status === 401) {
          console.warn("⚠️ Unauthorized. Logging out...")
          await authenticationStore.logout()
        } else {
          console.warn("⚠️ Failed to load account info:", response.problem)
        }
      } catch (e) {
        console.error("❌ Exception while fetching account info:", e)
      }
    }
    // Slight delay for a smoother UX before hiding the splash screen
    setTimeout(hideSplashScreen, 500)
  })

  const { preferencesStore } = useStores()
  const { themeScheme, setThemeContextOverride, ThemeProvider: AppThemeProvider } = useThemeProvider(
    preferencesStore.theme as "light" | "dark",
  )

  if (
    !rehydrated ||
    !isNavigationStateRestored ||
    !isI18nInitialized ||
    (!areFontsLoaded && !fontLoadError)
  ) {
    return null
  }

  const linking = {
    prefixes: [prefix],
    config,
  }

  return (
    <AppThemeProvider value={{ themeScheme, setThemeContextOverride }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ErrorBoundary catchErrors={Config.catchErrors}>
          <KeyboardProvider>
            <AppNavigator
              linking={linking}
              initialState={initialNavigationState}
              onStateChange={onNavigationStateChange}
            />
          </KeyboardProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </AppThemeProvider>
  )
}

export default App
