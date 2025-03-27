import { FC, useEffect, useState } from "react"
import { View, TextStyle, ViewStyle, Pressable, ScrollView, Dimensions, Modal, TouchableOpacity } from "react-native"
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
  const [showAllRoutes, setShowAllRoutes] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const DEFAULT_ROUTES_COUNT = 5
  const windowHeight = Dimensions.get('window').height
  
  useEffect(() => {
    setRoutes(routesData.routes)
  }, [])
  
  const renderRouteItem = (route: RouteItem) => {
    return (
      <View key={route.id} style={$routeItem}>
        <View style={$timeIconContainer}>
          <Icon icon="check" size={24} color="#4A89DC" />
        </View>
        
        <View style={$routeContent}>
          <View style={$routePathContainer}>
            <TouchableOpacity onPress={() => setSelectedLocation(route.startPoint)}>
              <Text style={$routePath} numberOfLines={1}>{route.startPoint}</Text>
            </TouchableOpacity>
            <View style={$arrowContainer}>
              <View style={$dashedLine} />
              <View style={$arrowHead} />
            </View>
            <TouchableOpacity onPress={() => setSelectedLocation(route.endPoint)}>
              <Text style={$routePath} numberOfLines={1}>{route.endPoint}</Text>
            </TouchableOpacity>
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

  const toggleRouteDisplay = () => {
    setShowAllRoutes((prev) => !prev)
  }

  const displayedRoutes = showAllRoutes ? routes : routes.slice(0, DEFAULT_ROUTES_COUNT)
  const buttonText = showAllRoutes ? "Show less routes" : "View all route history"

  return (
    <Screen preset="scroll" contentContainerStyle={[$styles.container, $screenContainer]} safeAreaEdges={["top"]}>
      <View style={$contentPadding}>
        <Text preset="heading" tx="userRoutesScreen:title" style={themed($title)} />
        
        <View style={$sectionTitleContainer}>
          <Icon icon="settings" size={20} color="#333333" />
          <Text style={$sectionTitle}>{showAllRoutes ? "All Routes" : "Recent Routes"}</Text>
        </View>
      </View>
      
      {/* Routes container */}
      <View style={$routesContainerWrapper}>
        {showAllRoutes ? (
          <ScrollView 
            style={[
              $routesScrollContainer, 
              { maxHeight: windowHeight * 0.65 }
            ]} 
            showsVerticalScrollIndicator={true}
          >
            {displayedRoutes.map(route => renderRouteItem(route))}
          </ScrollView>
        ) : (
          <View>
            {displayedRoutes.map(route => renderRouteItem(route))}
          </View>
        )}
      </View>
      
      <View style={$contentPadding}>
        <Pressable style={$viewAllContainer} onPress={toggleRouteDisplay}>
          <View style={$viewAllButtonContent}>
            <Text style={$viewAllText}>{buttonText}</Text>
            <Text style={$viewAllArrow}>{showAllRoutes ? '‹' : '›'}</Text>
          </View>
        </Pressable>
      </View>

      {/* Modal for displaying full location name */}
      <Modal
        visible={!!selectedLocation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedLocation(null)}
      >
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }} 
          activeOpacity={1} 
          onPress={() => setSelectedLocation(null)}
        >
          <View style={{
            backgroundColor: "white",
            borderRadius: 8,
            padding: 20,
            width: "80%",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}>
            <Text style={{
              fontSize: 18,
              textAlign: "center",
            }}>{selectedLocation}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  )
}

const $screenContainer: ViewStyle = {
  backgroundColor: "#F2F2F2",
  flexGrow: 1,
  paddingHorizontal: 10,
}

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $contentPadding: ViewStyle = {
  paddingHorizontal: 16,
}

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

const $routesContainerWrapper: ViewStyle = {
  flexGrow: 1,
}

const $routesScrollContainer: ViewStyle = {
  flexGrow: 1,
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

const $arrowContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginHorizontal: 8,
  height: 20,
  width: 40,
}

const $dashedLine: ViewStyle = {
  width: 30,
  height: 1,
  borderStyle: 'dashed',
  borderWidth: 1,
  borderColor: '#4A89DC',
  borderRadius: 1,
}

const $arrowLine: ViewStyle = {
  height: 2,
  width: 30,
  backgroundColor: "#4A89DC",
}

const $arrowHead: ViewStyle = {
  width: 0,
  height: 0,
  backgroundColor: "transparent",
  borderStyle: "solid",
  borderLeftWidth: 6,
  borderBottomWidth: 4,
  borderTopWidth: 4,
  borderLeftColor: "#4A89DC",
  borderBottomColor: "transparent",
  borderTopColor: "transparent",
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
  marginBottom: 24,
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