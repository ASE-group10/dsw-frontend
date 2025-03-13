import { FC, useEffect, useRef, useState } from "react"
import { View, ViewStyle, Platform, TouchableOpacity, Text, Dimensions } from "react-native"
import MapView, { Marker, Polyline, Region } from "react-native-maps"
import Constants from "expo-constants"
import { MaterialIcons } from "@expo/vector-icons"
import { Screen } from "@/components"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import { useAppTheme } from "@/utils/useAppTheme"
import Geolocation from "@react-native-community/geolocation"
import { apiRoute } from "@/services/api/apiRoute"

const isAndroid = Platform.OS === "android"
const { width } = Dimensions.get("window")
// Retrieve the API key from Expo Constants (injected via app.json extra)
const googleApiKey = Constants.expoConfig?.extra?.MAPS_API_KEY || ""

export const ExploreMapScreen: FC = function ExploreMapScreen() {
  const { themed } = useAppTheme()
  const $safeAreaInsets = useSafeAreaInsetsStyle(["top"])
  const mapRef = useRef<MapView>(null)

  // Track user's actual location separately
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  // Track region state for map display
  const [region, setRegion] = useState<Region>({
    latitude: 53.343467,
    longitude: -6.257544,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })

  // State for the destination marker and route
  const [route, setRoute] = useState<Array<{ latitude: number; longitude: number }>>([])
  const [mapReady, setMapReady] = useState(false)
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null)
  // New state for route time and distance
  const [routeTime, setRouteTime] = useState<number | null>(null)
  const [routeDistance, setRouteDistance] = useState<number | null>(null)
  // New state for destination place name
  const [destinationName, setDestinationName] = useState<string | null>(null)

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        console.log("User's current position:", position)
        const { latitude, longitude } = position.coords
        setUserLocation({ latitude, longitude })
      },
      (error) => {
        console.error("Error getting current position:", error)
      },
      { enableHighAccuracy: true },
    )
  }, [])

  // Track real-time user location
  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        console.log("User's real-time position:", position)
        const { latitude, longitude } = position.coords
        setUserLocation({ latitude, longitude }) // Only update userLocation, not region
      },
      (error) => {
        console.error("Error getting location", error)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 5, // Update only when the user moves at least 5 meters
      },
    )
    return () => {
      Geolocation.clearWatch(watchId)
    }
  }, [])

  useEffect(() => {
    console.log("Map Ready State Changed:", mapReady)
  }, [mapReady])

  // Function to handle zooming
  const handleZoom = (zoomIn: boolean) => {
    setRegion((prevRegion) => ({
      ...prevRegion,
      latitudeDelta: zoomIn ? prevRegion.latitudeDelta / 2 : prevRegion.latitudeDelta * 2,
      longitudeDelta: zoomIn ? prevRegion.longitudeDelta / 2 : prevRegion.longitudeDelta * 2,
    }))
  }

  // Function to fetch place name using Google Reverse Geocoding API
  const fetchPlaceName = async (coordinate: { latitude: number; longitude: number }) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${googleApiKey}`
      )
      const data = await response.json()
      if (data.status === "OK" && data.results.length > 0) {
        setDestinationName(data.results[0].formatted_address)
      } else {
        setDestinationName("Unknown Place")
      }
    } catch (error) {
      console.error("Error fetching place name:", error)
      setDestinationName("Unknown Place")
    }
  }

  // Function to fetch navigation route dynamically using the transformed response data
  const fetchRoute = async (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ) => {
    try {
      const response = await apiRoute.getNavigationRoute(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude,
        "car"
      )

      console.log(response)
      if (response.ok && response.data) {
        // If transformed data exists, use it; otherwise fallback to legacy parsing
        if (response.data.transformed && response.data.transformed.points) {
          setRoute(response.data.transformed.points)
          setRouteTime(response.data.transformed.time_min)
          setRouteDistance(response.data.transformed.distance_km)
        } else if (response.data.paths && response.data.paths.length > 0) {
          const path = response.data.paths[0]
          if (!path.points) {
            console.error("No points found in the path")
            return
          }
          const routeCoordinates = path.points.map((point: [number, number]) => ({
            latitude: point[1],
            longitude: point[0],
          }))
          setRoute(routeCoordinates)
          setRouteTime(path.time / 60000) // convert milliseconds to minutes
          setRouteDistance(path.distance / 1000) // convert meters to kilometers
        } else if (response.data.points) {
          setRoute(response.data.points)
          setRouteTime(response.data.time_min)
          setRouteDistance(response.data.distance_km)
        } else {
          console.error("No valid route data found", response.data)
        }
      } else {
        console.error("Failed to fetch route:", response.problem, response.data)
      }
    } catch (error) {
      console.error("Error fetching route:", error)
    }
  }

  // Handle map taps: add or remove a destination marker and show a Direction overlay instead of fetching route immediately
  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent
    if (!marker) {
      setMarker(coordinate)
      console.log(userLocation)
      // Fetch destination name for display
      fetchPlaceName(coordinate)
    } else {
      // Clear marker, route, and destination name if marker already exists
      setMarker(null)
      setRoute([])
      setRouteTime(null)
      setRouteDistance(null)
      setDestinationName(null)
    }
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      {...(isAndroid ? { KeyboardAvoidingViewProps: { behavior: undefined } } : {})}
    >
      <View style={[$container, themed($safeAreaInsets), $relativePosition]}>
        <MapView
          ref={mapRef}
          style={$map}
          region={region}
          onPress={handleMapPress}
          onLayout={() => setMapReady(true)}
          onMapReady={() => console.log("Map is fully loaded")}
          onRegionChangeComplete={(newRegion) => {
            if (
              Math.abs(newRegion.latitude - region.latitude) > 0.0001 ||
              Math.abs(newRegion.longitude - region.longitude) > 0.0001
            ) {
              setRegion(newRegion)
            }
          }}
          showsUserLocation
          followsUserLocation
        >
          {marker && <Marker coordinate={marker} title="Selected Destination" />}
          {route.length > 0 && (
            <Polyline coordinates={route} strokeWidth={4} strokeColor="#007AFF" />
          )}
        </MapView>

        {/* Direction Overlay */}
        {marker && route.length === 0 && (
          <View style={$directionOverlay}>
            <Text style={$destinationText}>
              {destinationName ? destinationName : "Unknown Place"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (userLocation && marker) {
                  fetchRoute(userLocation, marker)
                }
              }}
            >
              <MaterialIcons name="directions" size={50} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Route Info */}
        {route.length > 0 && routeTime !== null && routeDistance !== null && (
          <View style={$routeInfo}>
            <Text style={$routeInfoText}>Time: {routeTime.toFixed(1)} min</Text>
            <Text style={$routeInfoText}>Distance: {routeDistance.toFixed(2)} km</Text>
            {/* <Text style={$routeInfoText}> */}
            {/*   Current: {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)} */}
            {/* </Text> */}
          </View>
        )}

        {/* Zoom Controls */}
        <View style={$zoomControls}>
          <TouchableOpacity style={$zoomButton} onPress={() => handleZoom(true)}>
            <Text style={$zoomText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={$zoomButton} onPress={() => handleZoom(false)}>
            <Text style={$zoomText}>-</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  )
}

// Styles

const $container: ViewStyle = {
  flex: 1,
}

const $relativePosition: ViewStyle = {
  position: "relative",
}

const $map: ViewStyle = {
  flex: 1,
  width: "100%",
  height: "100%",
  minHeight: 800,
}

const $directionOverlay: ViewStyle = {
  position: "absolute",
  bottom: -670,
  left: 10,
  backgroundColor: "rgba(255,255,255,0.9)",
  padding: 8,
  borderRadius: 999,
  flexDirection: "row",
  alignItems: "center",
}

const $destinationText: ViewStyle = {
  position: "absolute",
  bottom: -20,
  left: 0,
  backgroundColor: "#00ffff",
  fontSize: 12,
  marginRight: 8,
  flex: 1,
}

const $routeInfo: ViewStyle = {
  position: "absolute",
  top: 670,
  left: 0,
  backgroundColor: "#9932cc",
  padding: 8,
  borderRadius: 4,
  width: width * 0.4, // Makes the bar longer (80% of screen width)
}

const $routeInfoText: ViewStyle = {
  fontSize: 14,
}

const $zoomControls: ViewStyle = {
  position: "absolute",
  bottom: -650,
  right: "0%",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  padding: 5,
  borderRadius: 10,
  zIndex: 9999,
  elevation: 10,
}

const $zoomButton: ViewStyle = {
  backgroundColor: "#007AFF",
  width: width * 0.12,
  height: width * 0.12,
  justifyContent: "center",
  alignItems: "center",
  borderRadius: width * 0.06,
  marginVertical: 5,
  borderWidth: 1,
  borderColor: "#E0E0E0",
}

const $zoomText: ViewStyle = {}
