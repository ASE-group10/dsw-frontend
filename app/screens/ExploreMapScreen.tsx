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

  // Define initial region
  const [region, setRegion] = useState<Region>({
    latitude: 53.343467,
    longitude: -6.257544,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })

  useEffect(() => {
    console.log("Map Ready State Changed:", mapReady)
  }, [mapReady])

  // Function to handle zoom
  const handleZoom = (zoomIn: boolean) => {
    setRegion((prevRegion) => ({
      ...prevRegion,
      latitudeDelta: zoomIn ? prevRegion.latitudeDelta / 2 : prevRegion.latitudeDelta * 2,
      longitudeDelta: zoomIn ? prevRegion.longitudeDelta / 2 : prevRegion.longitudeDelta * 2,
    }))
  }

  // Function to toggle marker on tap
  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent
    if (marker) {
      console.log("Removing previous marker")
      setMarker(null)
    } else {
      console.log("Adding marker at:", coordinate)
      setMarker(coordinate)
    }
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      {...(isAndroid ? { KeyboardAvoidingViewProps: { behavior: undefined } } : {})}
    >
      <View style={[$container, themed($safeAreaInsets)]}>
        <MapView
          ref={mapRef}
          style={$map}
          region={region} // Controlled zoom state
          onPress={handleMapPress} // Tap to toggle marker
          onLayout={() => {
            console.log("MapView layout completed")
            setMapReady(true)
          }}
          onMapReady={() => console.log("Map is fully loaded")}
          onRegionChangeComplete={(region) => console.log("Map moved to:", region)}
        >
          {marker && <Marker coordinate={marker} title="Selected Location" />}
        </MapView>

        {/* Zoom Controls (Placed Over Map) */}
        <View style={$zoomControls}>
          <TouchableOpacity style={$zoomButton} onPress={() => handleZoom(true)}>
            <Text>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={$zoomButton} onPress={() => handleZoom(false)}>
            <Text>-</Text>
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
  bottom: 100,
  right: 20,
  alignItems: "center",
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  padding: 10,
  borderRadius: 10,
}

const $zoomButton: ViewStyle = {
  backgroundColor: "#007AFF",
  width: 40,
  height: 40,
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 20,
  marginVertical: 5,
}
