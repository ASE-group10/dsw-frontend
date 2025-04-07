import React, { FC, useEffect, useState, useCallback } from "react"
import {
  View,
  TextStyle,
  ViewStyle,
  Pressable,
  ScrollView,
  Dimensions,
  Modal,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
} from "react-native"
import { Screen, Text, Icon } from "../components"
import { MainTabScreenProps } from "../navigators/MainNavigator"
import { $styles } from "../theme"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { apiUser } from "@/services/api"

const windowHeight = Dimensions.get("window").height

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// Define the history item type based on your API response
interface HistoryItem {
  routeHistoryId: number
  startStopName: string
  endStopName: string
  travelledDistance: number
  travelledTime: string
  dateLabel: string
  modesOfTransport: string[] // if it's a JSON string, we'll parse it
  stopCount: number
  stops: string[]
}

export const UserRoutesScreen: FC<MainTabScreenProps<"Routes">> = function UserRoutesScreen(
  _props,
) {
  const { themed, theme } = useAppTheme()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showAllRoutes, setShowAllRoutes] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const DEFAULT_ROUTES_COUNT = 3

  const fetchHistory = useCallback(async () => {
    try {
      setRefreshing(true)
      const response = await apiUser.getRouteHistory()
      if (response.ok) {
        // Reverse the data once while setting it
        const reversedHistory = [...response.data].reverse()
        setHistory(reversedHistory)
      } else {
        console.error("Failed to fetch history:", response.problem)
      }
    } catch (error) {
      console.error("Error fetching route history:", error)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  function parseModes(modes: string[]): string[] {
    if (modes.length === 1 && modes[0].trim().startsWith("[")) {
      try {
        return JSON.parse(modes[0])
      } catch (error) {
        console.error("Error parsing single-element modes JSON:", error)
        return modes
      }
    }
    if (modes.length > 1) {
      const joined = modes.join(",")
      if (joined.trim().startsWith("[") && joined.trim().endsWith("]")) {
        try {
          return JSON.parse(joined)
        } catch (error) {
          console.error("Error parsing joined modes JSON:", error)
          return modes
        }
      }
    }
    return modes
  }

  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    )
  }

  const renderHistoryItem = (item: HistoryItem) => {
    const isExpanded = expandedItems.includes(item.routeHistoryId)
    const modes = parseModes(item.modesOfTransport)

    return (
      <View key={String(item.routeHistoryId)} style={themed($routeItem)}>
        {/* Left Icon */}
        <View style={themed($verticalLine)} />
        {/* Main content */}
        <View style={themed($routeContent)}>
          {/* First Row: From: and Date */}
          <View style={themed($topRow)}>
            <View style={{ flex: 1 }}>
              <Text style={themed($smallLabel)}>From:</Text>
              <Text
                style={themed($originText)}
                numberOfLines={1}
                onPress={() => setSelectedLocation(item.startStopName)}
              >
                {item.startStopName}
              </Text>
            </View>
            <Text style={themed($dateText)}>{item.dateLabel}</Text>
          </View>

          {/* Second Row: To: */}
          <View style={themed($secondRow)}>
            <View style={{ flex: 1 }}>
              <Text style={themed($smallLabel)}>To:</Text>
              <Text
                style={themed($destinationText)}
                numberOfLines={1}
                onPress={() => setSelectedLocation(item.endStopName)}
              >
                {item.endStopName}
              </Text>
            </View>
          </View>

          {/* Third Row: Distance/time & "View more" button */}
          <View style={themed($bottomRow)}>
            <Text style={themed($distanceTimeText)}>
              {`about ${Math.round(item.travelledDistance)} km • ${item.travelledTime}`}
            </Text>
            <Pressable onPress={() => toggleExpand(item.routeHistoryId)}>
              <Text style={themed($viewMoreText)}>{isExpanded ? "Hide" : "View more"}</Text>
            </Pressable>
          </View>

          {isExpanded && (
            <View style={themed($expandedContainer)}>
              <Text style={themed($expandedTitle)}>{item.stopCount} Stops:</Text>
              <View style={themed($timelineContainer)}>
                {item.stops.map((stop, idx) => (
                  <View key={`${stop}-${idx}`} style={themed($stopSegment)}>
                    {/* Stop name */}
                    <View style={themed($stopItem)}>
                      <View style={themed($circle)} />
                      <Text style={themed($expandedStopText)}>{stop}</Text>
                    </View>
                    {/* Mode between stops */}
                    {idx < item.stops.length - 1 && (
                      <View style={themed($modeRow)}>
                        <View style={themed($modeConnector)} />
                        <Text style={themed($modeText)}>{modes[idx]}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }

  const toggleRouteDisplay = () => {
    setShowAllRoutes((prev) => !prev)
  }

  const displayedHistory = showAllRoutes ? history : history.slice(0, DEFAULT_ROUTES_COUNT)
  const buttonText = showAllRoutes ? "Show less routes" : "View all route history"

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={[$styles.container, themed($screenContainer)]}
      safeAreaEdges={["top"]}
    >
      {/* Header */}
      <View style={themed($contentPadding)}>
        <Text preset="heading" tx="userRoutesScreen:title" style={themed($title)} />
        <View style={themed($sectionTitleContainer)}>
          <Icon icon="settings" size={20} color={theme.colors.tint} />
          <Text style={themed($sectionTitle)}>
            {showAllRoutes ? "All Routes" : "Recent Routes"}
          </Text>
        </View>
      </View>
      <View style={themed($routesContainerWrapper)}>
        <ScrollView
          contentContainerStyle={themed($routesScrollContainer)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchHistory} />}
          alwaysBounceVertical
          bounces
          showsVerticalScrollIndicator
        >
          {displayedHistory.map(renderHistoryItem)}
          <View style={themed($contentPadding)}>
            <Pressable style={themed($viewAllContainer)} onPress={toggleRouteDisplay}>
              <View style={themed($viewAllButtonContent)}>
                <Text style={themed($viewAllText)}>{buttonText}</Text>
                <Text style={themed($viewAllArrow)}>{showAllRoutes ? "‹" : "›"}</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
      <Modal
        visible={!!selectedLocation}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLocation(null)}
      >
        <TouchableOpacity
          style={themed($modalOverlay)}
          activeOpacity={1}
          onPress={() => setSelectedLocation(null)}
        >
          <View style={themed($modalContent)}>
            <Text style={{ fontSize: 18, textAlign: "center" }}>{selectedLocation}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  )
}

/* -------------------------- Themed Styles -------------------------- */

//
// Text Styles
//
export const $smallLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
})

export const $originText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.text,
  fontWeight: "500",
})

export const $destinationText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.text,
  fontWeight: "500",
  marginLeft: 4,
})

export const $dateText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.textDim,
  marginLeft: spacing.xs,
})

export const $distanceTimeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
})

export const $viewMoreText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.tint,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
})

export const $expandedTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  fontWeight: "bold",
  color: colors.text,
  marginBottom: spacing.xxs,
})

export const $expandedStopText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.text,
})

export const $modeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontStyle: "italic",
  color: colors.textDim,
})

export const $viewAllText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.tint,
})

export const $viewAllArrow: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  color: colors.tint,
  marginLeft: spacing.xs,
})

//
// View Styles
//
export const $verticalLine: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 2,
  backgroundColor: colors.separator,
  marginHorizontal: spacing.xxs,
  borderRadius: 1,
})

export const $routeItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  paddingVertical: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

export const $routeContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  marginRight: 10,
})

export const $topRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: spacing.xxs,
})

export const $secondRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.xxs,
})

export const $bottomRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

export const $expandedContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.sm,
  padding: spacing.sm,
  backgroundColor: colors.background,
  borderRadius: spacing.xs,
})

export const $timelineContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginLeft: spacing.sm,
})

export const $stopSegment: ThemedStyle<ViewStyle> = () => ({
  marginBottom: 12,
})

export const $stopItem: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
})

export const $circle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.tint,
  marginRight: spacing.xs,
})

export const $modeRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginLeft: spacing.xxs,
  marginTop: spacing.xxs,
})

export const $modeConnector: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 1,
  height: 20,
  backgroundColor: colors.separator,
  marginRight: spacing.xs,
  marginLeft: spacing.xxs,
})

export const $viewAllContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
  alignItems: "center",
  marginBottom: spacing.lg,
})

export const $viewAllButtonContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  backgroundColor: colors.tintInactive,
  borderRadius: spacing.xl,
})

export const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
})

export const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  padding: spacing.md,
  width: "80%",
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
})

//
// Additional styles you might want to update
//
export const $screenContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  flexGrow: 1,
  paddingHorizontal: spacing.md,
})

export const $title: ThemedStyle<TextStyle> = ({ colors, spacing, typography }) => ({
  marginBottom: spacing.sm,
  color: colors.text,
  fontSize: typography.primary.bold ? 20 : 18,
  // Optionally: fontFamily: typography.primary.bold,
})

export const $contentPadding: ViewStyle = {
  paddingHorizontal: 16,
}

export const $routesContainerWrapper: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

export const $sectionTitleContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginVertical: spacing.md,
})

export const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 20,
  fontWeight: "bold",
  color: colors.text,
  marginLeft: spacing.xs,
})

export const $routesScrollContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})
