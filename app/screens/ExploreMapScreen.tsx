import { FC, useEffect, useRef, useState } from "react"
import { View, ViewStyle, Platform, TouchableOpacity, Text, Dimensions } from "react-native"
import MapView, { Marker, Region } from "react-native-maps"
import { Screen } from "@/components"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import { useAppTheme } from "@/utils/useAppTheme"

const isAndroid = Platform.OS === "android"

// Get screen dimensions
const { width } = Dimensions.get("window")

export const ExploreMapScreen: FC = function ExploreMapScreen() {
  const { themed } = useAppTheme()
  const $safeAreaInsets = useSafeAreaInsetsStyle(["top"])
  const mapRef = useRef<MapView>(null)

  const [mapReady, setMapReady] = useState(false)
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null)

  const [region, setRegion] = useState<Region>({
    latitude: 53.343467,
    longitude: -6.257544,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })

  useEffect(() => {
    console.log("Map Ready State Changed:", mapReady)
  }, [mapReady])

  const handleZoom = (zoomIn: boolean) => {
    console.log(zoomIn ? "Zooming In" : "Zooming Out")
    setRegion((prevRegion) => ({
      ...prevRegion,
      latitudeDelta: zoomIn ? prevRegion.latitudeDelta / 2 : prevRegion.latitudeDelta * 2,
      longitudeDelta: zoomIn ? prevRegion.longitudeDelta / 2 : prevRegion.longitudeDelta * 2,
    }))
  }

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent
    console.log(marker ? "Removing marker" : "Adding marker", coordinate)
    setMarker(marker ? null : coordinate)
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
            console.log("MapView layout completed")
            setMapReady(true)
          }}
          onMapReady={() => console.log("Map is fully loaded")}
          onRegionChangeComplete={(region) => console.log("Map moved to:", region)}
        >
          {marker && <Marker coordinate={marker} title="Selected Location" />}
        </MapView>

        {/* Zoom Controls - Positioned at BOTTOM RIGHT */}
        <View style={$zoomControls}>
          <TouchableOpacity
            style={$zoomButton}
            onPress={() => {
              console.log("Zoom In Pressed")
              handleZoom(true)
            }}
          >
            <Text style={$zoomText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={$zoomButton}
            onPress={() => {
              console.log("Zoom Out Pressed")
              handleZoom(false)
            }}
          >
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
  right: "0%", // Ensure it's at the right side
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0, 0, 0, 0.5)", // Subtle transparency
  padding: 5,
  borderRadius: 10,
  zIndex: 9999,
  elevation: 10,
}

const $zoomButton: ViewStyle = {
  backgroundColor: "#007AFF", // Blue theme
  width: width * 0.12, // 12% of screen width
  height: width * 0.12, // Keep square shape
  justifyContent: "center",
  alignItems: "center",
  borderRadius: width * 0.06, // 50% of button size for a perfect circle
  marginVertical: 5,
  borderWidth: 1, // Thinner border
  borderColor: "#E0E0E0", // Softer border color
}

// @ts-ignore
const $zoomText: ViewStyle = {
  color: "white",
  fontSize: width * 0.05, // 5% of screen width for responsive text
  fontWeight: "bold",
}
