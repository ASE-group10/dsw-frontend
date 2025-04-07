import React, { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { Screen, Text } from "@/components"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { MainTabScreenProps } from "@/navigators/MainNavigator"

export const PreferenceScreen: FC<MainTabScreenProps<"Preference">> = function PreferenceScreen() {
  const { themed } = useAppTheme()

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($container)}
    >
      <Text style={themed($title)} preset="heading" text="Preference" />
      
    </Screen>
  )
}


const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})

const $title: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginBottom: spacing.md,
  color: colors.text,
  fontSize: 24,
  fontWeight: "bold",
})

const $description: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 16,
})

export default PreferenceScreen