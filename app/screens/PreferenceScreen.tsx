import React, { FC } from "react"
import { View, ViewStyle, TextStyle, Switch } from "react-native"
import { Screen, Text } from "@/components"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import { useStores } from "@/models"

export const PreferenceScreen: FC<MainTabScreenProps<"Preference">> = function PreferenceScreen() {
  const { themed } = useAppTheme()
  const { preferencesStore } = useStores()

  // State for SMS notifications toggle
  const [smsNotifications, setSmsNotifications] = React.useState(false)

  // Toggle theme function (same as in UserProfileScreen)
  const toggleTheme = () => {
    const newTheme = preferencesStore.theme === "dark" ? "light" : "dark"
    preferencesStore.setTheme(newTheme)
  }
  

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($container)}
    >
      {/* Change Notification Settings */}
      <Text style={themed($sectionTitle)} text="Change Notification Settings" />
      <View style={themed($row)}>
        <Text style={themed($label)} text="SMS Notifications" />
        <Switch
          value={smsNotifications}
          onValueChange={(value) => setSmsNotifications(value)}
        />
      </View>
      <Text style={themed($description)} text="Changes save instantly." />

      {/* Change Theme */}
      <Text style={themed($sectionTitle)} text="Change Theme" />
      <View style={themed($row)}>
        <Text style={themed($label)} text="Light/Dark Mode" />
        <Switch
          value={preferencesStore.theme === "dark"}
          onValueChange={toggleTheme}
        />
      </View>
      <Text style={themed($description)} text="Applies theme immediately." />
    </Screen>
  )
}

// ----------------------- Themed Styles -----------------------

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.xl,
  marginBottom: spacing.md,
  color: colors.text,
  fontSize: 18,
  fontWeight: "bold",
})

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.md,
})

const $label: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
})

const $description: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 14,
  marginBottom: spacing.lg,
})

export default PreferenceScreen