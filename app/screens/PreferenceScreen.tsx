import React, { FC } from "react"
import { View, ViewStyle, TextStyle, Switch ,TouchableOpacity} from "react-native"
import { Screen, Text, Icon } from "@/components"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import { useStores } from "@/models"
import { Button } from "@/components"

export const PreferenceScreen: FC<MainTabScreenProps<"Preference">> = function PreferenceScreen({ navigation }) {
    const { themed } = useAppTheme()
    const { preferencesStore } = useStores()
  
    // State for SMS notifications toggle
    const [smsNotifications, setSmsNotifications] = React.useState(false)
  
    // Toggle theme function
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
        {/* 返回按钮 */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={themed($backIconContainer)}>
        <Icon icon="back" size={24} 
         />
      </TouchableOpacity>
        {/* Change Notification Settings */}
        <Text style={themed($sectionTitle)} text="Change Notification Settings" />
        <View style={themed($row)}>
          <Text style={themed($label)} text="SMS Notifications" />
          <Switch
            value={smsNotifications}
            onValueChange={(value) => setSmsNotifications(value)}
          />
        </View>
  
        {/* Change Theme */}
        <Text style={themed($sectionTitle)} text="Change Theme" />
        <View style={themed($row)}>
          <Text style={themed($label)} text="Light/Dark Mode" />
          <Switch
            value={preferencesStore.theme === "dark"}
            onValueChange={toggleTheme}
          />
        </View>
      </Screen>
    )
  }

// ----------------------- Themed Styles -----------------------

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})
const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginBottom: spacing.md,
    alignSelf: "flex-start",
  })
  const $backIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginBottom: spacing.md,
    alignSelf: "flex-start",
    padding: spacing.sm, // 增加点击区域
  })
  
  const $backIcon: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.text, // 图标颜色
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