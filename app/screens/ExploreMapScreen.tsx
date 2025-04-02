import React, { FC, useEffect, useRef, useState } from "react"
import {
  View,
  ViewStyle,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  FlatList,
  Animated,
  Easing,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import Constants from "expo-constants"
import MapView, { Marker, UrlTile, MapEvent, Polyline, Callout } from "react-native-maps"
import Geolocation from "@react-native-community/geolocation"

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { apiRoute } from "@/services/api"

const { width, height } = Dimensions.get("window")
const googleApiKey = Constants.expoConfig?.extra?.MAPS_API_KEY || ""

// Available transport modes mapped to MaterialCommunityIcons
const modeIcons: { [key: string]: string } = {
  car: "car-outline",
  walk: "walk",
  bus: "bus",
  cycle: "bike",
}

// If your API expects "bike" but your UI uses "cycle," you can map them:
const uiToApiMapping: { [key: string]: string } = {
  car: "car",
  walk: "walk",
  bus: "bus",
  cycle: "bike", // convert "cycle" to "bike" if needed
}

const DEFAULT_MODE = "car"

/**
 * The main screen component
 */
export const ExploreMapScreen: FC = function ExploreMapScreen() {
  // 1) Basic states
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  )
  const [userHeading, setUserHeading] = useState<number>(0) // New state for heading
  const [stops, setStops] = useState<Array<{ latitude: number; longitude: number; name: string }>>(
    [],
  )
  const [journeyStarted, setJourneyStarted] = useState<boolean>(false)
  const journeyTrackingInterval = useRef<NodeJS.Timeout | null>(null)
  const mapRef = useRef<MapView>(null)
  const journeyWatchId = useRef<number | null>(null)
  const [followsUser, setFollowsUser] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedModes, setSelectedModes] = useState<{ [index: number]: string }>({})
  const [routeData, setRouteData] = useState<any>(null)
  const [routePolylines, setRoutePolylines] = useState<
    { mode: string; coordinates: { latitude: number; longitude: number }[] }[]
  >([])
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false)

  // 2) Collapsed/Expanded state for the bottom section
  const [collapsed, setCollapsed] = useState<boolean>(false)

  // 3) Animated value for the bottom container's height
  // Let's say expanded is 0.45 * screen height, collapsed is 80 px
  const expandedHeight = height * 0.45
  const collapsedHeight = 140
  const bottomHeightAnim = useRef(new Animated.Value(expandedHeight)).current

  /**
   * Listen for `collapsed` changes and animate accordingly.
   */
  useEffect(() => {
    Animated.timing(bottomHeightAnim, {
      toValue: collapsed ? collapsedHeight : expandedHeight,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start()
  }, [collapsed])

  /** Toggle the bottom section between collapsed & expanded */
  const toggleBottomSection = () => {
    setCollapsed((prev) => !prev)
  }

  // 4) On mount, get user location
  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords
        setUserLocation({ latitude, longitude })
        setUserHeading(heading || 0)
      },
      (error) => {
        console.error("Error getting current position:", error)
      },
      { enableHighAccuracy: true },
    )
  }, [])

  // 5) Add stop
  const addStop = (latitude: number, longitude: number, name: string) => {
    setStops((prevStops) => {
      let newStops: typeof prevStops = []
      // If no stops exist yet and userLocation is available, add it as the first stop
      if (prevStops.length === 0 && userLocation) {
        newStops = [
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            name: "Current Location",
          },
          { latitude, longitude, name },
        ]
      } else {
        // Determine the number of manual stops already added.
        // If the first stop is "Current Location", subtract 1.
        const manualStopsCount =
          prevStops.length > 0 && prevStops[0].name === "Current Location"
            ? prevStops.length - 1
            : prevStops.length
        if (manualStopsCount >= 5) {
          Alert.alert("Stop Limit Reached", "Maximum of 5 stops allowed.")
          return prevStops
        }
        newStops = [...prevStops, { latitude, longitude, name }]
      }

      // Update the selected mode for the newly added stop.
      // The new stop’s index is at the end of the newStops array.
      const newIndex = newStops.length - 1
      setSelectedModes((prevModes) => ({
        ...prevModes,
        [newIndex]: DEFAULT_MODE,
      }))

      Alert.alert("Success", `Added stop: ${name}`)
      return newStops
    })
  }

  // 6) Add stop by search
  const addSearchLocationAsStop = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Invalid Input", "Please enter a valid location.")
      return
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchQuery,
      )}&key=${googleApiKey}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location
        const name = data.results[0].formatted_address
        addStop(lat, lng, name)
        setSearchQuery("")
      } else {
        Alert.alert("Location Not Found", "Please try a different search.")
      }
    } catch (error) {
      Alert.alert("Network Error", "Failed to connect. Please check your internet connection.")
    }
  }

  // 7) Add stop by map long-press
  const handleMapLongPress = async (e: MapEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status === "OK" && data.results.length > 0) {
        const name = data.results[0].formatted_address
        addStop(latitude, longitude, name)
      } else {
        addStop(latitude, longitude, `Stop (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
      }
    } catch (error) {
      Alert.alert("Network Error", "Failed to reverse-geocode this location.")
    }
  }

  // 8) Remove stop
  const removeStop = (index: number) => {
    setRoutePolylines([])
    setStops((prev) => prev.filter((_, i) => i !== index))
    setSelectedModes((prev) => {
      const updated = { ...prev }
      delete updated[index]
      return updated
    })
  }

  // 9) Select mode for a stop
  const handleSelectMode = (index: number, mode: string) => {
    setSelectedModes((prev) => ({
      ...prev,
      [index]: mode,
    }))
  }

  // 10) GET route logic
  const handleGetRoute = async () => {
    setIsLoadingRoute(true) // Indicate loading state
    try {
      // Convert stops to [longitude, latitude]
      const points: [number, number][] = stops.map((stop) => [stop.longitude, stop.latitude])
      // Build modes
      const segmentModes = stops
        .slice(1)
        .map((_, index) => uiToApiMapping[selectedModes[index]] || DEFAULT_MODE)

      console.log("About to call getMultiStopNavigationRoute...", points, segmentModes)
      const response = await apiRoute.getMultiStopNavigationRoute(points, segmentModes)

      if (response.ok && response.data) {
        console.log("Route data:", response.data)
        setRouteData(response.data)
        Alert.alert("Success", "Route calculated successfully!")

        // Build polylines
        if (response.data.segments && Array.isArray(response.data.segments)) {
          const newPolylines: {
            mode: string
            coordinates: { latitude: number; longitude: number }[]
          }[] = []

          response.data.segments.forEach((segment: any) => {
            const segMode = segment.mode || "unknown"

            // If "points" is present
            if (segment.points && Array.isArray(segment.points)) {
              const coords = segment.points.map((pt: [number, number]) => ({
                latitude: pt[1],
                longitude: pt[0],
              }))
              newPolylines.push({ mode: segMode, coordinates: coords })
            }
            // If "paths" is present
            if (segment.paths && Array.isArray(segment.paths)) {
              segment.paths.forEach((path: any) => {
                if (path.points && Array.isArray(path.points)) {
                  const pathCoords = path.points.map((pt: [number, number]) => ({
                    latitude: pt[1],
                    longitude: pt[0],
                  }))
                  newPolylines.push({ mode: path.mode || segMode, coordinates: pathCoords })
                }
              })
            }
          })

          setRoutePolylines(newPolylines)
        }

        // After success, collapse the bottom section
        setCollapsed(true)
      } else {
        console.error("Route API Error:", response.problem)
        Alert.alert("Error", "Unable to calculate route. Please try again.")
      }
    } catch (error) {
      console.error("Route Fetch Error:", error)
      Alert.alert("Error", "Something went wrong while fetching the route.")
    }finally {
      setIsLoadingRoute(false) // Reset loading state
    }
  }

  const trackJourneyProgress = () => {
    // Get the current position with heading info
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords
        console.log("Tracking journey progress:", latitude, longitude, heading)

        // Animate the camera to zoom in and update heading (direction)
        if (mapRef.current) {
          mapRef.current.animateCamera(
            {
              center: { latitude, longitude },
              heading,
              zoom: 18,
            },
            { duration: 500 },
          )
        }
      },
      (error) => console.error("Error fetching location:", error),
      { enableHighAccuracy: true },
    )
  }

  const handleJourneyToggle = async () => {
    if (!journeyStarted) {
      console.log("Start Journey button clicked");
      setJourneyStarted(true);
      setFollowsUser(false);

      // Start watching position with real-time updates
      const watchId = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading } = position.coords
          console.log("Updating position and heading:", heading)
          // Update state so we can render our custom arrow marker
          setUserLocation({ latitude, longitude })
          setUserHeading(heading || 0)

          if (mapRef.current) {
            mapRef.current.animateCamera(
              {
                center: { latitude, longitude },
                heading: heading || 0, // Use 0 if heading is unavailable
                zoom: 18,
                pitch: 45, // Optional: Add slight pitch for better perspective
              },
              { duration: 500 },
            )
          }
        },
        (error) => console.error("Error watching position:", error),
        {
          enableHighAccuracy: true,
          distanceFilter: 1, // Update every 1 meter movement
          interval: 1000, // Android: update interval
          fastestInterval: 500, // Android: fastest interval
        },
      )
      journeyWatchId.current = watchId;
    } else {
      console.log("End Journey button clicked");
      setJourneyStarted(false);
      setFollowsUser(true);

      // Clear the position watcher
      if (journeyWatchId.current !== null) {
        Geolocation.clearWatch(journeyWatchId.current);
        journeyWatchId.current = null;
      }

      // Zoom back to a normal view and reset camera settings
      if (mapRef.current && userLocation) {
        mapRef.current.animateCamera(
          {
            center: userLocation,
            heading: 0,
            pitch: 0,
            zoom: 15, // Adjust this value to your preferred default zoom level
          },
          { duration: 500 }
        );
      }

      // Reset to default mode:
      // 1. Clear all polylines
      setRoutePolylines([])
      // 2. Clear all stops
      setStops([])
      // 3. Clear route data
      setRouteData(null)
      // 4. Reset selected modes
      setSelectedModes({})
      // 5. Expand the bottom section back
      setCollapsed(false)
    }
  }

  const LegendComponent = () => (
    <View style={styles.legendContainer}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#007AFF" }]} />
          <MaterialCommunityIcons name="car" size={21} color="#007AFF" />
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#2ecc71" }]} />
          <MaterialCommunityIcons name="walk" size={21} color="#2ecc71" />
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#f1c40f" }]} />
          <MaterialCommunityIcons name="bus" size={21} color="#f1c40f" />
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#9b59b6" }]} />
          <MaterialCommunityIcons name="bike" size={21} color="#9b59b6" />
        </View>
      </View>
    </View>
  )

  // ---------------
  // Render
  // ---------------
  return (
    <View style={$container}>
      {userLocation && (
        <MapView
          ref={mapRef}
          style={$map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
          followsUserLocation={followsUser} // Controlled by state
          onLongPress={handleMapLongPress}
          legalLabelInsets={{ bottom: -9999, left: -9999 }}
          rotateEnabled={true} // Enable map rotation
        >
          <UrlTile
            urlTemplate="https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=lko7A40ouEx25V2jU3MkC8xKI0Dme2rbWsQQVSe6zXUqnhTMepLHw8ztXXXYuVcO"
            maximumZ={19}
            flipY={false}
          />

          {/* Custom arrow marker when journey is started */}
          {journeyStarted && userLocation && (
            <Marker
              coordinate={userLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              flat
              rotation={userHeading}
            >
              <MaterialCommunityIcons name="navigation" size={80} color="#FF6347" />
            </Marker>
          )}

          {/* Markers */}
          {stops.map((stop, index) => {
            // Hide marker if the stop is the user's current location
            if (stop.name === "Current Location") return null

            return (
              <Marker
                key={index}
                coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                title={`Stop ${index + 1}: ${stop.name}`}
              />
            )
          })}

          {/* Polylines */}
          {routePolylines.map((poly, idx) => {
            let color = "#007AFF"
            switch (poly.mode) {
              case "walk":
                color = "#2ecc71"
                break
              case "bus":
                color = "#f1c40f"
                break
              case "bike":
              case "cycle":
                color = "#9b59b6"
                break
              case "car":
              default:
                color = "#007AFF"
                break
            }
            return (
              <Polyline
                key={`poly-${idx}`}
                coordinates={poly.coordinates}
                strokeColor={color}
                strokeWidth={4}
              />
            )
          })}
        </MapView>
      )}

      {/* Animated Bottom Section */}
      <Animated.View
        style={[
          $bottomAnimatedContainer,
          {
            height: bottomHeightAnim,
          },
        ]}
      >
        {collapsed ? (
          <View style={styles.collapsedContent}>
            {/* Legend in Collapsed Section */}
            <LegendComponent />

            {/* Control Buttons Row */}
            <View style={styles.controlButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.startButton,
                  { backgroundColor: journeyStarted ? "#FF6347" : "#2ecc71" },
                ]}
                onPress={handleJourneyToggle}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>
                    {journeyStarted ? "End Journey" : "Start Journey"}
                  </Text>
                  <MaterialCommunityIcons name="road-variant" size={20} color="#fff" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleBottomSection} style={styles.expandButton}>
                <MaterialCommunityIcons name="chevron-up" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // If expanded, show the entire bottom UI.
          // The collapse button will only be shown if routeData exists and routePolylines is non-empty.
          <View style={$bottomSectionContent}>
            <LegendComponent />
            <View style={$searchRow}>
              {/* Search Bar */}
              <View style={$searchBar}>
                <TextInput
                  style={$searchInput}
                  placeholder="Search for a stop"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                {/* "Add Stop" button (icon) */}
                <TouchableOpacity style={stopButton} onPress={addSearchLocationAsStop}>
                  <MaterialCommunityIcons name="map-marker-plus" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Get Route Button (icon only) */}
              <TouchableOpacity
                style={[
                  $routeButton,
                  (stops.length < 2 || isLoadingRoute) && { backgroundColor: "#ccc" },
                ]}
                onPress={stops.length < 2 || isLoadingRoute ? undefined : handleGetRoute}
                disabled={stops.length < 2 || isLoadingRoute}
              >
                {isLoadingRoute ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="map-search-outline" size={24} color="#fff" />
                )}
              </TouchableOpacity>

              {/* Collapse Button:
                  Render only if routeData exists and routePolylines is non-empty */}
              {routeData && routePolylines.length > 0 && (
                <TouchableOpacity style={styles.collapseButton} onPress={toggleBottomSection}>
                  <MaterialCommunityIcons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* List of Stops */}
            <FlatList
              data={stops}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <StopItem
                  stop={item}
                  index={index}
                  totalStops={stops.length}
                  selectedMode={selectedModes[index]}
                  onRemove={removeStop}
                  onSelectMode={handleSelectMode}
                />
              )}
            />
          </View>
        )}
      </Animated.View>
    </View>
  )
}

// ---------------
/** StopItem display */
interface StopItemProps {
  stop: { latitude: number; longitude: number; name: string }
  index: number
  totalStops: number
  selectedMode?: string
  onRemove: (index: number) => void
  onSelectMode: (index: number, mode: string) => void
}
const StopItem: FC<StopItemProps> = ({
                                       stop,
                                       index,
                                       totalStops,
                                       selectedMode,
                                       onRemove,
                                       onSelectMode,
                                     }) => {
  const [expanded, setExpanded] = useState<boolean>(false)
  const dropdownAnim = useRef(new Animated.Value(0)).current

  const toggleDropdown = () => {
    if (expanded) {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start(() => setExpanded(false))
    } else {
      setExpanded(true)
      Animated.timing(dropdownAnim, {
        toValue: 50,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start()
    }
  }

  // If this is the LAST stop in the list (index === totalStops - 1),
  // we show *no* mode selection
  const isLastStop = index === totalStops - 1

  return (
    <View style={$stopItemContainer}>
      <View style={$stopTopRow}>
        <Text style={$stopTitle}>{`Stop ${index + 1}: ${stop.name}`}</Text>
        <TouchableOpacity onPress={() => onRemove(index)}>
          <MaterialCommunityIcons name="minus-circle-outline" size={20} color="#FF6347" />
        </TouchableOpacity>
      </View>

      {!isLastStop && (
        <>
          <View style={$modeSelectionRow}>
            <TouchableOpacity style={$modeIconButton} onPress={toggleDropdown}>
              <MaterialCommunityIcons
                name={modeIcons[selectedMode || "car"]}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
          </View>

          {expanded && (
            <Animated.View style={[$modeDropdown, { height: dropdownAnim }]}>
              <View style={$modeButtonRow}>
                {Object.keys(modeIcons).map((modeKey) => {
                  const isActive = selectedMode === modeKey
                  return (
                    <TouchableOpacity
                      key={modeKey}
                      style={[
                        $modeOptionButton,
                        isActive ? $activeModeOption : $inactiveModeOption,
                      ]}
                      onPress={() => {
                        onSelectMode(index, modeKey)
                        toggleDropdown()
                      }}
                    >
                      <MaterialCommunityIcons
                        name={modeIcons[modeKey]}
                        size={20}
                        color={isActive ? "#fff" : "#333"}
                      />
                    </TouchableOpacity>
                  )
                })}
              </View>
            </Animated.View>
          )}
        </>
      )}
    </View>
  )
}

// ------------------ STYLES ------------------
const $container: ViewStyle = {
  flex: 1,
  backgroundColor: "#fff",
}

const $map: ViewStyle = {
  flex: 1,
  width: "100%",
  height: height * 0.55, // a bit less so we have space for the bottom
}

const $bottomAnimatedContainer: ViewStyle = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  overflow: "hidden", // so we can animate
  backgroundColor: "#fff",
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
  elevation: 5,
}

const $bottomSectionContent: ViewStyle = {
  flex: 1,
  padding: 8,
}

const $searchRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8,
  justifyContent: "space-between",
}

const $searchBar: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  backgroundColor: "#fff",
  padding: 8,
  borderRadius: 8,
  marginRight: 8,
  alignItems: "center",
}

const $searchInput: ViewStyle = {
  flex: 1,
  paddingHorizontal: 10,
  borderRadius: 5,
  backgroundColor: "#f0f0f0",
  marginRight: 8,
  height: 40,
}

const stopButton: ViewStyle = {
  backgroundColor: "#EA4335",
  paddingVertical: 10,
  paddingHorizontal: 10,
  borderRadius: 5,
  alignItems: "center",
  justifyContent: "center",
}

const $routeButton: ViewStyle = {
  width: 50,
  height: 50,
  backgroundColor: "#007AFF",
  borderRadius: 25,
  alignItems: "center",
  justifyContent: "center",
}

const $stopItemContainer: ViewStyle = {
  marginBottom: 12,
  backgroundColor: "#fafafa",
  borderRadius: 8,
  padding: 10,
  borderWidth: 1,
  borderColor: "#eee",
}

const $stopTopRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
}

const $stopTitle: ViewStyle = {
  fontSize: 16,
  fontWeight: "600",
  maxWidth: "80%",
}

const $modeSelectionRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 6,
}

const $modeIconButton: ViewStyle = {
  padding: 6,
}

const $modeDropdown: ViewStyle = {
  overflow: "hidden",
}

const $modeButtonRow: ViewStyle = {
  flexDirection: "row",
  marginTop: 6,
  justifyContent: "flex-start",
  flexWrap: "wrap",
}

const $modeOptionButton: ViewStyle = {
  padding: 6,
  marginRight: 8,
  marginBottom: 8,
  borderRadius: 5,
}

const $activeModeOption: ViewStyle = {
  backgroundColor: "#007AFF",
}

const $inactiveModeOption: ViewStyle = {
  backgroundColor: "#eee",
}

const styles = StyleSheet.create({
  collapsedContent: {
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    flexDirection: "column",
  },
  controlButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  startButton: {
    height: 50,
    width: 300,
    backgroundColor: "#2ecc71",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    marginRight: 8, // Space between start button and expand button
  },
  buttonContent: {
    alignItems: "center",
    flexDirection: "row",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  expandButton: {
    alignItems: "center",
    backgroundColor: "#888",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  legendContainer: {
    marginBottom: 6,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 6,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    marginHorizontal: 6,
  },
  legendColor: {
    borderRadius: 3,
    height: 16,
    marginRight: 4,
    width: 16,
  },
  collapseButton: {
    alignItems: "center",
    backgroundColor: "#888",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    marginLeft: 8,
    width: 50,
  },
})
