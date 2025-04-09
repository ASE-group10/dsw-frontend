import React, { FC, useEffect } from "react"
import { View, ViewStyle, TextStyle, Switch, TouchableOpacity } from "react-native"
import { Screen, Text, Icon } from "@/components"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import { useStores } from "@/models"
import { observer } from "mobx-react-lite"

export const PreferenceScreen: FC<MainTabScreenProps<"Preference">> = observer(function PreferenceScreen({ navigation }) {
  const { themed } = useAppTheme()
  const { preferencesStore } = useStores()

  const {
    notificationsEnabled,
    theme,
    setTheme,
    setNotificationsEnabled,
    updatePreferences,
    fetchPreferences,
  } = preferencesStore

  useEffect(() => {
    fetchPreferences()
  }, [])

  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value)
    updatePreferences({ notificationsEnabled: value })
  }

  const handleToggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    updatePreferences({ theme: newTheme })
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={themed($backIconContainer)}>
        <Icon icon="back" size={24} />
      </TouchableOpacity>

      {/* Notification Settings */}
      <Text style={themed($sectionTitle)} text="Change Notification Settings" />
      <View style={themed($row)}>
        <Text style={themed($label)} text="SMS Notifications" />
        <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />
      </View>

      {/* Theme Settings */}
      <Text style={themed($sectionTitle)} text="Change Theme" />
      <View style={themed($row)}>
        <Text style={themed($label)} text="Light/Dark Mode" />
        <Switch value={theme === "dark"} onValueChange={handleToggleTheme} />
      </View>
    </Screen>
  )
})

// ----------------------- Themed Styles -----------------------

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})

const $backIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  alignSelf: "flex-start",
  padding: spacing.sm,
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

export default PreferenceScreen
