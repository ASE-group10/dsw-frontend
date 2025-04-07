import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { CompositeScreenProps } from "@react-navigation/native"
import { TextStyle, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Icon } from "@/components"
import { translate } from "@/i18n"
import { UserRoutesScreen, ExploreMapScreen, UserProfileScreen, ApiTestScreen } from "@/screens"
import { UserRewardsScreen } from "@/screens/UserRewardsScreen"
import type { ThemedStyle } from "@/theme"
import { AppStackParamList, AppStackScreenProps } from "./AppNavigator"
import { useAppTheme } from "@/utils/useAppTheme"
//import { PreferenceScreen } from "../screens/PreferenceScreen"
import { PreferenceScreen } from "@/screens/PreferenceScreen"
export type MainTabParamList = {
  Routes: undefined
  Navigation: undefined
  Profile: undefined
  Rewards: undefined
  ApiTest: undefined
  Preference: undefined
}

/**
 * Helper for automatically generating navigation prop types for each route.
 *
 * More info: https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

const Tab = createBottomTabNavigator<MainTabParamList>()

/**
 * This is the main navigator for the demo screens with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 * @returns {JSX.Element} The rendered `MainNavigator`.
 */




export function MainNavigator(): JSX.Element {
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: themed([$tabBar, { height: bottom + 70 }]),
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: themed($tabBarLabel),
        tabBarItemStyle: themed($tabBarItem),
      }}
    >
      <Tab.Screen
        name="Navigation"
        component={ExploreMapScreen}
        options={{
          tabBarLabel: translate("mainNavigator:navigationTab"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="pin" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Routes"
        component={UserRoutesScreen}
        options={{
          tabBarLabel: translate("mainNavigator:routesTab"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="check" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />

      <Tab.Screen
        name="Rewards"
        component={UserRewardsScreen}
        options={{
          tabBarAccessibilityLabel: translate("mainNavigator:rewardsTab"),
          tabBarLabel: translate("mainNavigator:rewardsTab"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="heart" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />
    

      <Tab.Screen
        name="Profile"
        component={UserProfileScreen}
        options={{
          tabBarLabel: translate("mainNavigator:profileTab"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="menu" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderTopColor: colors.transparent,
})

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
})

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  color: colors.text,
})
