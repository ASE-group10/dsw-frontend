import React, { FC, useCallback, useEffect } from "react"
import {
  Image,
  LayoutAnimation,
  Linking,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
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
      // Optionally update any local overrides if needed.
      if (userTheme === "light" || userTheme === "dark") {
        setThemeContextOverride(userTheme)
      }
    }, [userTheme, setThemeContextOverride])

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
                <Text style={themed($userNameText)}>
                  {authenticationStore.authName}
                </Text>
                <Text style={themed($userEmailText)}>
                  {authenticationStore.authEmail}
                </Text>
              </View>
            </View>
          }
        />

        {/* <View style={themed($itemsContainer)}>
          <Button
            onPress={toggleTheme}
            text={`Toggle Theme: ${themeContext}`}
          />
        </View> */}
        <View style={themed($buttonContainer)}>
          <Button
            style={themed($button)}
            text="Preference" 
            onPress={() => _props.navigation.navigate("Preference")} 
          />
        </View>
        <View style={themed($buttonContainer)}>
          <Button
            style={themed($button)}
            tx="common:logOut"
            onPress={handleLogout}
          />
        </View>
      </Screen>
    )
  },
)

// ----------------------- Themed Styles -----------------------

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
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

const $userListItem: ThemedStyle<ViewStyle> = () => ({
  minHeight: 80,
})

const $userNameText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 20,
  fontWeight: "bold",
  color: colors.text,
  // Optionally add: fontFamily: typography.primary.bold,
})

const $userEmailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.textDim,
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

const $avatar: ThemedStyle<ViewStyle> = () => ({
  width: 60,
  height: 60,
  borderRadius: 30,
})
