import React, { FC } from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity } from "react-native"
import { Screen, Text, Icon } from "@/components"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { MainTabScreenProps } from "@/navigators/MainNavigator"

export const AccountScreen: FC<MainTabScreenProps<"Account">> = function AccountScreen({ navigation }) {
  const { themed } = useAppTheme()

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      contentContainerStyle={themed($container)}
    >
      {/* 返回按钮 */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={themed($backIconContainer)}>
        <Icon icon="back" size={24} />
      </TouchableOpacity>

      {/* 页面标题 */}
      <Text style={themed($sectionTitle)} text="Account Settings" />

      {/* 示例内容 */}
      <Text style={themed($description)} text="Manage your account settings here." />
    </Screen>
  )
}

// ----------------------- Themed Styles -----------------------

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})

const $backIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  alignSelf: "flex-start",
  padding: spacing.sm,
})

const $backIcon: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.xl,
  marginBottom: spacing.md,
  color: colors.text,
  fontSize: 18,
  fontWeight: "bold",
})

const $description: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 14,
  marginBottom: spacing.lg,
})

export default AccountScreen