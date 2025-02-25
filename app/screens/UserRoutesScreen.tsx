import { FC } from "react"
import { TextStyle } from "react-native"
import { Screen, Text } from "../components"
import { MainTabScreenProps } from "../navigators/MainNavigator"
import { $styles } from "../theme"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"

export const UserRoutesScreen: FC<MainTabScreenProps<"Routes">> = function UserRoutesScreen(
  _props,
) {
  const { themed } = useAppTheme()
  return (
    <Screen preset="scroll" contentContainerStyle={$styles.container} safeAreaEdges={["top"]}>
      <Text preset="heading" tx="userRoutesScreen:title" style={themed($title)} />
    </Screen>
  )
}

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})
