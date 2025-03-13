import { FC, useEffect, useState } from "react"
import { View, TextStyle, ViewStyle, Pressable } from "react-native"
import { Screen, Text, Icon } from "../components"
import { MainTabScreenProps } from "../navigators/MainNavigator"
import { $styles } from "../theme"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"

import routesData from "./data/routes.json"

// Define the route item type
interface RouteItem {
  id: string
  startPoint: string
  endPoint: string
  distance: string
  duration: string
  date: string
}

export const UserRoutesScreen: FC<MainTabScreenProps<"Routes">> = function UserRoutesScreen(
  _props,
) {
  const { themed } = useAppTheme()
  const [routes, setRoutes] = useState<RouteItem[]>([])
  
  useEffect(() => {
    setRoutes(routesData.routes)
  }, [])
  
  const renderRouteItem = (route: RouteItem) => {
    return (
      <View key={route.id} style={$routeItem}>
        <View style={$timeIconContainer}>
          <Icon icon="view" size={24} color="#4A89DC" />
        </View>
        
        <View style={$routeContent}>
          <View style={$routePathContainer}>
            <Text style={$routePath} numberOfLines={1}>{route.startPoint}</Text>
            <Text style={$arrowText}>›</Text>
            <Text style={$routePath} numberOfLines={1}>{route.endPoint}</Text>
          </View>
          
          <View style={$detailsContainer}>
            <Text style={$routeDetails}>{route.distance}</Text>
            <Text style={$bulletText}>•</Text>
            <Text style={$routeDetails}>{route.duration}</Text>
          </View>
        </View>

        <View style={$dateContainer}>
          <Text style={$dateText}>{route.date}</Text>
        </View>
      </View>
    )
  }

  return (
    <Screen preset="scroll" contentContainerStyle={[$styles.container, $screenContainer]} safeAreaEdges={["top"]}>
      <Text preset="heading" tx="userRoutesScreen:title" style={themed($title)} />
      
      <View style={$sectionTitleContainer}>
        <Icon icon="settings" size={20} color="#333333" />
        <Text style={$sectionTitle}>Recent Routes</Text>
      </View>
      
      <View style={$routesContainer}>
        {routes.map(route => renderRouteItem(route))}
      </View>
      
      <Pressable style={$viewAllContainer}>
        <View style={$viewAllButtonContent}>
          <Text style={$viewAllText}>View all route history</Text>
          <Text style={$viewAllArrow}>›</Text>
        </View>
      </Pressable>
    </Screen>
  )
}

const $screenContainer: ViewStyle = {
  backgroundColor: "#F2F2F2",
}

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

// Additional styles for the route history display
const $sectionTitleContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginVertical: 16,
}

const $sectionTitle: TextStyle = {
  fontSize: 20,
  fontWeight: "bold",
  marginLeft: 8,
}

const $routesContainer: ViewStyle = {
  marginTop: 8,
}

const $routeItem: ViewStyle = {
  flexDirection: "row",
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: "#E0E0E0",
}

const $timeIconContainer: ViewStyle = {
  width: 40,
  alignItems: "center",
  justifyContent: "center",
}

const $routeContent: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  marginRight: 10,
  overflow: "hidden",
}

const $routePathContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 4,
  flexWrap: "nowrap",
}

const $routePath: TextStyle = {
  fontSize: 16,
  fontWeight: "500",
  flexShrink: 1,
}

const $arrowText: TextStyle = {
  fontSize: 18,
  marginHorizontal: 4,
  color: "#333333",
}

const $detailsContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
}

const $bulletText: TextStyle = {
  fontSize: 14,
  marginHorizontal: 8,
  color: "#666666",
}

const $routeDetails: TextStyle = {
  fontSize: 14,
  color: "#666666",
}

const $dateContainer: ViewStyle = {
  width: 80,
  alignItems: "flex-end",
  justifyContent: "center",
}

const $dateText: TextStyle = {
  fontSize: 14,
  color: "#666666",
  textAlign: "right",
}

const $viewAllContainer: ViewStyle = {
  marginTop: 24,
  alignItems: "center",
}

const $viewAllButtonContent: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
  paddingHorizontal: 24,
  backgroundColor: "#E8F0FF",
  borderRadius: 24,
}

const $viewAllText: TextStyle = {
  fontSize: 16,
  color: "#4A89DC",
}

const $viewAllArrow: TextStyle = {
  fontSize: 18,
  color: "#4A89DC",
  marginLeft: 8,
}