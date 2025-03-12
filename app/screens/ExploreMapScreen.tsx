import { FC, useEffect, useRef, useState } from "react"
import { View, ViewStyle, Platform, TouchableOpacity, Text, Dimensions } from "react-native"
import MapView, { Marker, Polyline, Region } from "react-native-maps"
import { Screen } from "@/components"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import { useAppTheme } from "@/utils/useAppTheme"
import Geolocation from "@react-native-community/geolocation"
import { api } from "@/services/api"

const isAndroid = Platform.OS === "android"
const { width } = Dimensions.get("window")

export const ExploreMapScreen: FC = function ExploreMapScreen() {
  const { themed } = useAppTheme()
  const $safeAreaInsets = useSafeAreaInsetsStyle(["top"])
  const mapRef = useRef<MapView>(null)

  // Track user's actual location separately
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  )

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
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
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
        distanceFilter: 5, // Update only when the user moves at least 10 meters
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

  // Function to fetch navigation route dynamically
  const fetchRoute = async (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ) => {
    try {
      // Call the getNavigationRoute method from the API class
      const response = await api.getNavigationRoute(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude,
      )

      if (response.ok && response.data) {
        // Convert API response points to Polyline-compatible coordinates
        const routeCoordinates = response.data.points.map(
          (point: { lat: number; lon: number }) => ({
            latitude: point.lat,
            longitude: point.lon,
          }),
        )
        setRoute(routeCoordinates)
      } else {
        console.error("Failed to fetch route:", response.problem)
      }
    } catch (error) {
      console.error("Error fetching route:", error)
    }
  }

  // Handle map taps: add or remove a destination marker and fetch the route if possible
  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent
    if (!marker) {
      setMarker(coordinate)
      console.log(userLocation)
      // Only fetch route if the user's current location is known
      if (userLocation) {
        fetchRoute(userLocation, coordinate)
      }
    } else {
      // Clear marker and route if marker already exists
      setMarker(null)
      setRoute([])
    }
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      {...(isAndroid ? { KeyboardAvoidingViewProps: { behavior: undefined } } : {})}
    >
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <View style={[$container, themed($safeAreaInsets), { position: "relative" }]}>
        <MapView
          ref={mapRef}
          style={$map}
          region={region}
          onPress={handleMapPress}
          onLayout={() => {
            setMapReady(true)
          }}
          onMapReady={() => console.log("Map is fully loaded")}
          onRegionChangeComplete={(newRegion) => {
            if (
              Math.abs(newRegion.latitude - region.latitude) > 0.0001 ||
              Math.abs(newRegion.longitude - region.longitude) > 0.0001
            ) {
              setRegion(newRegion)
            }
          }}
          showsUserLocation={true}
          followsUserLocation={true}
        >
          {marker && <Marker coordinate={marker} title="Selected Destination" />}
          {route.length > 0 && (
            <Polyline
              coordinates={route}
              strokeWidth={4}
              strokeColor="#007AFF" // You can also derive colors dynamically if needed
            />
          )}
        </MapView>

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

const $container: ViewStyle = {
  flex: 1,
}

const $map: ViewStyle = {
  flex: 1,
  width: "100%",
  height: "100%",
  minHeight: 800,
}

const $zoomControls: ViewStyle = {
  position: "absolute",
  bottom: -650, // Corrected for bottom-right positioning
  right: "0%", // Ensure it's on the right side
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0, 0, 0, 0.5)", // Subtle transparency
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
