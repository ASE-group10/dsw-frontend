import { FC, useCallback, useEffect } from "react"
import * as Application from "expo-application"
import {
  LayoutAnimation,
  Linking,
  TextStyle,
  useColorScheme,
  View,
  ViewStyle,
  Image,
} from "react-native"
import { Button, ListItem, Screen, Text, Card, Icon } from "../components"
import { DemoTabScreenProps } from "../navigators/DemoNavigator"
import type { ThemedStyle } from "@/theme"
import { $styles } from "../theme"
import { isRTL } from "../i18n"
import { useStores } from "../models"
import { useAppTheme } from "../utils/useAppTheme"

/**
 * @param {string} url - The URL to open in the browser.
 * @returns {void} - No return value.
 */
function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url))
}

const usingHermes = typeof HermesInternal === "object" && HermesInternal !== null

export const UserProfileScreen: FC<DemoTabScreenProps<"Profile">> = function UserProfileScreen(
  _props,
) {
  const { setThemeContextOverride, themeContext, themed } = useAppTheme()
  const { authenticationStore } = useStores()
  const handleLogout = async () => {
    await authenticationStore.logout()
  }

  // @ts-expect-error
  const usingFabric = global.nativeFabricUIManager != null

  const toggleTheme = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setThemeContextOverride(themeContext === "dark" ? "light" : "dark")
  }, [themeContext, setThemeContextOverride])

  // Resets the theme to the system theme
  const colorScheme = useColorScheme()
  const resetTheme = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setThemeContextOverride(undefined)
  }, [setThemeContextOverride])

  useEffect(() => {
    console.log("authenticationStore:", authenticationStore)
  }, [])

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
          <ListItem
            LeftComponent={<Icon icon="community" size={60} />}
            text="Username"
            RightComponent={<Text style={themed($userEmailText)}>user@example.com</Text>}
            topSeparator={false}
            style={themed($userListItem)}
            textStyle={themed($userNameText)}
            subTextStyle={themed($userEmailText)}
          />
        }
      />

      <Text preset="bold">Current system theme: {colorScheme}</Text>
      <Text preset="bold">Current app theme: {themeContext}</Text>
      <Button onPress={resetTheme} text={`Reset`} />

      <View style={themed($itemsContainer)}>
        <Button onPress={toggleTheme} text={`Toggle Theme: ${themeContext}`} />
      </View>
      <View style={themed($itemsContainer)}>
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">App Id</Text>
              <Text>{Application.applicationId}</Text>
            </View>
          }
        />
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">App Name</Text>
              <Text>{Application.applicationName}</Text>
            </View>
          }
        />
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">App Version</Text>
              <Text>{Application.nativeApplicationVersion}</Text>
            </View>
          }
        />
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">App Build Version</Text>
              <Text>{Application.nativeBuildVersion}</Text>
            </View>
          }
        />
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">Hermes Enabled</Text>
              <Text>{String(usingHermes)}</Text>
            </View>
          }
        />
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">Fabric Enabled</Text>
              <Text>{String(usingFabric)}</Text>
            </View>
          }
        />
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
