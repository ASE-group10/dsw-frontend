import { FC, useEffect, useRef, useState } from "react"
import { View, ViewStyle, Platform, TouchableOpacity, Text } from "react-native"
import MapView, { Marker, Region } from "react-native-maps"
import { Screen } from "@/components"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import { useAppTheme } from "@/utils/useAppTheme"

const isAndroid = Platform.OS === "android"

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

        {/* Debug: Move Zoom Controls to Center */}
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
  top: "50%", // Keep the position you liked
  left: "50%",
  transform: [{ translateX: 150 }, { translateY: 630 }], // Keep the adjusted position
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0, 0, 0, 0.5)", // Subtle background
  padding: 5,
  borderRadius: 10,
  zIndex: 9999,
  elevation: 10,
}

const $zoomButton: ViewStyle = {
  backgroundColor: "#007AFF", // Keep blue theme
  width: 50, // Smaller button
  height: 50,
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 25, // Keep circular
  marginVertical: 5,
  borderWidth: 1, // Thinner border
  borderColor: "#E0E0E0", // Softer border color
}

// @ts-ignore
const $zoomText: ViewStyle = {
  color: "white",
  fontSize: 22, // Slightly smaller text
  fontWeight: "bold",
}
