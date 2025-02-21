import { FC, useEffect, useRef, useState } from "react"
import { View, ViewStyle, Platform } from "react-native"
import MapView, { Marker, Region } from "react-native-maps"
import { Screen } from "@/components"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import { useAppTheme } from "@/utils/useAppTheme"

const isAndroid = Platform.OS === "android"

export const ExploreMapScreen: FC = function ExploreMapScreen() {
  const { themed } = useAppTheme()
  const $safeAreaInsets = useSafeAreaInsetsStyle(["top"])

  // Debug log for rendering component
  console.log("ExploreMapScreen rendering...")

  // Track when the map layout is ready
  const [mapReady, setMapReady] = useState(false)
  const mapRef = useRef<MapView>(null)

  // Define initial region
  const initialRegion: Region = {
    latitude: 53.343467,
    longitude: -6.257544,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }

  useEffect(() => {
    console.log("Map Ready State Changed:", mapReady)
  }, [mapReady])

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      {...(isAndroid ? { KeyboardAvoidingViewProps: { behavior: undefined } } : {})}
    >
      <View style={[themed($container), $safeAreaInsets]}>
        <MapView
          ref={mapRef}
          style={$map}
          initialRegion={initialRegion}
          onLayout={() => {
            console.log("MapView layout completed")
            setMapReady(true)
          }}
          onMapReady={() => console.log("Map is fully loaded")}
          onRegionChangeComplete={(region) => console.log("Map moved to:", region)}
        >
          <Marker
            coordinate={{ latitude: 53.343467, longitude: -6.257544 }}
            title="Marker Title"
            description="Marker Description"
          />
        </MapView>
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
  minHeight: 800, // Ensures the map has a visible height
}
