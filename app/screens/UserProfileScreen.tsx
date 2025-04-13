import React, { FC, useCallback, useEffect } from "react"
import { Image, LayoutAnimation, Linking, View, ViewStyle, TextStyle } from "react-native"
import { Button, Screen, Text, Card, Icon } from "@/components"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import type { ThemedStyle } from "@/theme"
import { $styles } from "@/theme"
import { isRTL } from "@/i18n"
import { useStores } from "@/models"
import { useAppTheme } from "@/utils/useAppTheme"
import { observer } from "mobx-react-lite"

/**
 * Opens a URL in the browser.
 * @param {string} url - The URL to open.
 */
function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url))
}

const usingHermes = typeof HermesInternal === "object" && HermesInternal !== null

export const UserProfileScreen: FC<MainTabScreenProps<"Profile">> = observer(
  function UserProfileScreen(_props) {
    const { themed, themeContext, setThemeContextOverride } = useAppTheme()
    const { authenticationStore, preferencesStore } = useStores()

    const handleLogout = async () => {
      await authenticationStore.logout()
    }

    const userTheme = preferencesStore.theme

    const toggleTheme = useCallback(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      const newTheme = userTheme === "dark" ? "light" : "dark"
      preferencesStore.setTheme(newTheme)
    }, [userTheme, preferencesStore])

    useEffect(() => {
      if (userTheme === "light" || userTheme === "dark") {
        setThemeContextOverride(userTheme)
      }
    }, [userTheme, setThemeContextOverride])

    return (
      <Screen
        preset="fixed"
        safeAreaEdges={["top", "bottom"]}
        contentContainerStyle={themed($container)}
      >
        <View style={themed($content)}>
          <Text style={themed($title)} preset="heading" tx="userProfileScreen:title" />

          <Card
            style={themed($userCard)}
            ContentComponent={
              <View style={themed($userCardContent)}>
                <View style={themed($avatarContainer)}>
                  {authenticationStore.authPicture ? (
                    <Image
                      source={{ uri: authenticationStore.authPicture }}
                      style={themed($avatar)}
                      resizeMode="cover"
                    />
                  ) : (
                    <Icon icon="community" size={60} />
                  )}
                </View>
                <View style={themed($userInfoContainer)}>
                  <Text style={themed($userNameText)}>{authenticationStore.authName}</Text>
                  <Text style={themed($userEmailText)}>{authenticationStore.authEmail}</Text>
                </View>
              </View>
            }
          />

          <View style={themed($buttonContainer)}>
            <Button
              style={themed($button)}
              text="Account"
              onPress={() => _props.navigation.navigate("Account")}
            />
          </View>
          <View style={themed($buttonContainer)}>
            <Button
              style={themed($button)}
              text="Preference"
              onPress={() => _props.navigation.navigate("Preference")}
            />
          </View>
        </View>

        {/* Logout button fixed at the bottom */}
        <View style={themed($logoutContainer)}>
          <Button
            style={themed($button)}
            text="Log Out"
            onPress={handleLogout}
          />
        </View>
      </Screen>
    )
  },
)

// ----------------------- Themed Styles -----------------------

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.md,
  justifyContent: "space-between", // Distribute content between top and bottom
})

const $content: ThemedStyle<ViewStyle> = () => ({
  flex: 1, // Allow content to take up available space
})

const $logoutContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg, // Add spacing from the bottom
})

const $title: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginBottom: spacing.xxl,
  color: colors.text,
})

const $userCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginHorizontal: spacing.md,
  marginTop: spacing.md,
  marginBottom: spacing.xl,
})

const $userNameText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 20,
  fontWeight: "bold",
  color: colors.text,
})

const $userEmailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.textDim,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  width: "100%",
  alignItems: "center",
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

const $avatar: ThemedStyle<ViewStyle> = () => ({
  width: 60,
  height: 60,
  borderRadius: 30,
})