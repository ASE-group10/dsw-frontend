import { FC, useCallback, useEffect } from "react"
import * as Application from "expo-application"
import {
  LayoutAnimation,
  Linking,
  TextStyle,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native"
import { Button, ListItem, Screen, Text, Card, Icon } from "@/components"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import type { ThemedStyle } from "@/theme"
import { $styles } from "@/theme"
import { isRTL } from "@/i18n"
import { useStores } from "@/models"
import { useAppTheme } from "@/utils/useAppTheme"

/**
 * @param {string} url - The URL to open in the browser.
 * @returns {void} - No return value.
 */
function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url))
}

const usingHermes = typeof HermesInternal === "object" && HermesInternal !== null

export const UserProfileScreen: FC<MainTabScreenProps<"Profile">> = function UserProfileScreen(
  _props,
) {
  const { setThemeContextOverride, themeContext, themed } = useAppTheme()
  const { authenticationStore, preferencesStore } = useStores()
  const handleLogout = async () => {
    await authenticationStore.logout()
  }
  const Username = authenticationStore.authName
  const Email = authenticationStore.authEmail
  const userTheme = preferencesStore.theme

  const toggleTheme = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    const newTheme = userTheme === "dark" ? "light" : "dark"
    preferencesStore.setTheme(newTheme)
    setThemeContextOverride(newTheme)
  }, [userTheme, preferencesStore, setThemeContextOverride])
  useEffect(() => {
    if (userTheme === "light" || userTheme === "dark") {
      setThemeContextOverride(userTheme)
    }
  }, [userTheme, setThemeContextOverride])

  const colorScheme = useColorScheme()

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      contentContainerStyle={[$styles.container, themed($container)]}
    >
      <Text style={themed($title)} preset="heading" tx="userProfileScreen:title" />

      <Card
        style={themed($userCard)}
        ContentComponent={
          <View style={themed($userCardContent)}>
            <View style={themed($avatarContainer)}>
              <Icon icon="community" size={60} />
            </View>
            <View style={themed($userInfoContainer)}>
              <Text style={themed($userNameText)}>{Username}</Text>
              <Text style={themed($userEmailText)}>{Email}</Text>
            </View>
          </View>
        }
      />

      <Text preset="bold">Current system theme: {colorScheme}</Text>
      <Text preset="bold">Current app theme: {themeContext}</Text>

      <View style={themed($itemsContainer)}>
        <Button onPress={toggleTheme} text={`Toggle Theme: ${themeContext}`} />
      </View>

      {/* <View style={themed($buttonContainer)}>
        <Button style={themed($button)} tx="userProfileScreen:reactotron" onPress={demoReactotron} />
        <Text style={themed($hint)} tx={`userProfileScreen:${Platform.OS}ReactotronHint` as const} />
      </View> */}
      <View style={themed($buttonContainer)}>
        <Button style={themed($button)} tx="common:logOut" onPress={handleLogout} />
      </View>
    </Screen>
  )
}

const $userCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginHorizontal: spacing.md,
  marginTop: spacing.md,
  marginBottom: spacing.xl,
})

const $userListItem: ThemedStyle<ViewStyle> = () => ({
  minHeight: 80,
})

const $userNameText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 20,
  fontWeight: "bold",
  color: colors.text,
})

const $userEmailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.textDim,
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xxl,
})

const $reportBugsLink: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.lg,
  alignSelf: isRTL ? "flex-start" : "flex-end",
})

const $item: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $itemsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.xl,
})

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $userCardContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.md,
})

const $avatarContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.md,
})

const $userInfoContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
})
