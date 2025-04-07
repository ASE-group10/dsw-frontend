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
  RefreshControl, // <-- import here
} from "react-native";
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
  const { themed } = useAppTheme()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showAllRoutes, setShowAllRoutes] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const [refreshing, setRefreshing] = useState(false) // <-- track refresh status
  const DEFAULT_ROUTES_COUNT = 3

  // 1. Separate out this function so we can reuse it for pull-to-refresh
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

  // 2. Fetch initially
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Helper to parse the modes array
  function parseModes(modes: string[]): string[] {
    // If there's only one string and it starts with '[', it's probably a full JSON array in a single string.
    if (modes.length === 1 && modes[0].trim().startsWith("[")) {
      try {
        return JSON.parse(modes[0])
      } catch (error) {
        console.error("Error parsing single-element modes JSON:", error)
        return modes
      }
    }

    // If there's more than one element, they may be pieces of a JSON array missing commas.
    if (modes.length > 1) {
      // Use join(",") so the resulting string has commas:
      const joined = modes.join(",")
      // For example, ["[\"car\"", "\"car\"]"] => "[\"car\",\"car\"]"
      if (joined.trim().startsWith("[") && joined.trim().endsWith("]")) {
        try {
          return JSON.parse(joined)
        } catch (error) {
          console.error("Error parsing joined modes JSON:", error)
          return modes
        }
      }
    }

    // If neither scenario applies, just return the raw array
    return modes
  }

  // Toggle expand/collapse for a history card
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
      <View key={String(item.routeHistoryId)} style={$routeItem}>
        {/* Left Icon */}
        <View style={$verticalLine} />
        {/* Main content */}
        <View style={$routeContent}>
          {/* First Row: From: and Date */}
          <View style={$topRow}>
            <View style={{ flex: 1 }}>
              <Text style={$smallLabel}>From:</Text>
              <Text
                style={$originText}
                numberOfLines={1}
                onPress={() => setSelectedLocation(item.startStopName)}
              >
                {item.startStopName}
              </Text>
            </View>
            <Text style={$dateText}>{item.dateLabel}</Text>
          </View>

          {/* Second Row: To: */}
          <View style={$secondRow}>
            <View style={{ flex: 1 }}>
              <Text style={$smallLabel}>To:</Text>
              <Text
                style={$destinationText}
                numberOfLines={1}
                onPress={() => setSelectedLocation(item.endStopName)}
              >
                {item.endStopName}
              </Text>
            </View>
          </View>

          {/* Third Row: Distance/time & "View more" button */}
          <View style={$bottomRow}>
            <Text style={$distanceTimeText}>
              {`about ${Math.round(item.travelledDistance)} km • ${item.travelledTime}`}
            </Text>
            <Pressable onPress={() => toggleExpand(item.routeHistoryId)}>
              <Text style={$viewMoreText}>{isExpanded ? "Hide" : "View more"}</Text>
            </Pressable>
          </View>

          {isExpanded && (
            <View style={$expandedContainer}>
              <Text style={$expandedTitle}>{item.stopCount} Stops:</Text>
              <View style={$timelineContainer}>
                {item.stops.map((stop, idx) => (
                  <View key={`${stop}-${idx}`} style={$stopSegment}>
                    {/* Stop name */}
                    <View style={$stopItem}>
                      <View style={$circle} />
                      <Text style={$expandedStopText}>{stop}</Text>
                    </View>

                    {/* Show the travel mode *between* this stop and the next stop */}
                    {idx < item.stops.length - 1 && (
                      <View style={$modeRow}>
                        <View style={$modeConnector} />
                        <Text style={$modeText}>{modes[idx]}</Text>
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

  // Decide which history items to show
  const displayedHistory = showAllRoutes
    ? history
    : history.slice(0, DEFAULT_ROUTES_COUNT)

  const buttonText = showAllRoutes ? "Show less routes" : "View all route history"

  return (
    <Screen preset="scroll" contentContainerStyle={[$styles.container, $screenContainer]} safeAreaEdges={["top"]}>
      {/* ----- Header ----- */}
      <View style={$contentPadding}>
        <Text preset="heading" tx="userRoutesScreen:title" style={themed($title)} />
        <View style={$sectionTitleContainer}>
          <Icon icon="settings" size={20} color="#333333" />
          <Text style={$sectionTitle}>{showAllRoutes ? "All Routes" : "Recent Routes"}</Text>
        </View>
      </View>
      <View style={$routesContainerWrapper}>
        <ScrollView
          contentContainerStyle={$routesScrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchHistory}
            />
          }
          alwaysBounceVertical
          bounces
          showsVerticalScrollIndicator
        >
          {displayedHistory.map(renderHistoryItem)}
          {/* The button to show more/less routes can sit below the list */}
          <View style={$contentPadding}>
            <Pressable style={$viewAllContainer} onPress={toggleRouteDisplay}>
              <View style={$viewAllButtonContent}>
                <Text style={$viewAllText}>{buttonText}</Text>
                <Text style={$viewAllArrow}>{showAllRoutes ? "‹" : "›"}</Text>
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
        <TouchableOpacity style={$modalOverlay} activeOpacity={1} onPress={() => setSelectedLocation(null)}>
          <View style={$modalContent}>
            <Text style={{ fontSize: 18, textAlign: "center" }}>{selectedLocation}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  )
}

/* -------------------------- Styles -------------------------- */

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
  flex: 1, // Make sure the parent View takes full available height
}

const $routesScrollContainer: ViewStyle = {
  paddingBottom: 24, // Only padding, no minHeight
}

/** Each card row */
const $routeItem: ViewStyle = {
  flexDirection: "row",
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: "#E0E0E0",
  // You could also add backgroundColor: "#FFFFFF" if you want each row to have a white background
}

const $routeContent: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  marginRight: 10,
}

/** Top row: From and Date */
const $topRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 4,
}

/** Second row: To */
const $secondRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 4,
}

const $smallLabel: TextStyle = {
  fontSize: 12,
  color: "#666666",
}

const $originText: TextStyle = {
  fontSize: 14,
  color: "#333333",
  fontWeight: "500",
}

const $destinationText: TextStyle = {
  fontSize: 14,
  color: "#333333",
  fontWeight: "500",
  marginLeft: 4,
}

/** Bottom row with distance/time on the left, "View more" on the right */
const $bottomRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $dateText: TextStyle = {
  fontSize: 14,
  color: "#666666",
  marginLeft: 8,
}

/** Distance/time text */
const $distanceTimeText: TextStyle = {
  fontSize: 14,
  color: "#666666",
}

const $verticalLine: ViewStyle = {
  width: 2,
  backgroundColor: "#4A89DC",
  marginHorizontal: 10,
  borderRadius: 1,
}

/** "View more" button text */
const $viewMoreText: TextStyle = {
  fontSize: 14,
  color: "#4A89DC",
  paddingHorizontal: 8,
  paddingVertical: 4,
}

/** Container for expanded details */
const $expandedContainer: ViewStyle = {
  marginTop: 8,
  padding: 8,
  backgroundColor: "#f9f9f9",
  borderRadius: 8,
}

const $expandedTitle: TextStyle = {
  fontSize: 14,
  fontWeight: "bold",
  color: "#333333",
  marginBottom: 4,
}

/** Timeline-based styling */
const $timelineContainer: ViewStyle = {
  marginLeft: 8,
}

const $stopSegment: ViewStyle = {
  marginBottom: 12,
}

const $stopItem: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
}

const $circle: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: "#4A89DC",
  marginRight: 8,
}

const $expandedStopText: TextStyle = {
  fontSize: 14,
  color: "#444444",
}

/** Connector + Mode in between stops */
const $modeRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginLeft: 4,
  marginTop: 4,
}

const $modeConnector: ViewStyle = {
  width: 1,
  height: 20,
  backgroundColor: "#4A89DC",
  marginRight: 8,
  marginLeft: 3,
}

const $modeText: TextStyle = {
  fontSize: 14,
  fontStyle: "italic",
  color: "#666666",
}

/** "View All" or "Show less" button area */
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

/** Modal overlay for location details */
const $modalOverlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
}

const $modalContent: ViewStyle = {
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
}
