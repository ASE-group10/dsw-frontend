import React, { FC } from "react"
import { Dimensions, TouchableOpacity, View, ViewStyle } from "react-native";
import MapView, {
  Marker,
  Polyline,
  MapEvent,
  PROVIDER_GOOGLE,
} from "react-native-maps"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"

const { height } = Dimensions.get("window")

// Define the props needed by the MapViewComponent.
interface MapViewComponentProps {
  userLocation: { latitude: number; longitude: number }
  mapRef: React.RefObject<MapView>
  followsUser: boolean
  handleMapLongPress: (e: MapEvent) => void
  stops: { latitude: number; longitude: number; name: string }[]
  routePolylines: { mode: string; coordinates: { latitude: number; longitude: number }[] }[]
}

const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#8ec3b9" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1a3646" }],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#121212" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#182731" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#000000" }],
  },
]

export const MapViewComponent: FC<MapViewComponentProps> = ({
  userLocation,
  mapRef,
  followsUser,
  handleMapLongPress,
  stops,
  routePolylines,
}) => {
  const { themed, theme } = useAppTheme()
  // console.log("Current theme:", theme)
  const initialRegion = {
    latitude: userLocation.latitude - 0.002,
    longitude: userLocation.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  }

  const recenterMap = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: initialRegion.latitude,
          longitude: initialRegion.longitude,
        },
        zoom: 15,
      })
    }
  }

  return (
    <View style={themed($container)}>
      <MapView
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        style={themed($map)}
        initialRegion={initialRegion}
        showsMyLocationButton={false}
        showsUserLocation={true}
        followsUserLocation={followsUser}
        onLongPress={handleMapLongPress}
        legalLabelInsets={{ bottom: -9999, left: -9999 }}
        rotateEnabled={true}
        customMapStyle={theme.isDark ? darkMapStyle : []}
      >
        {stops.map((stop, index) => {
          if (stop.name === "Current Location") return null
          return (
            <Marker
              key={index}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={`Stop ${index + 1}: ${stop.name}`}
            />
          )
        })}
        {routePolylines.map((poly, idx) => {
          let color = theme.colors.tint // default uses theme tint
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
              color = theme.colors.tint
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
      {/* Custom locate button */}
      <TouchableOpacity style={themed($locateButton)} onPress={recenterMap}>
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={24}
          color={theme.colors.palette.neutral100}
        />
      </TouchableOpacity>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $map: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  width: "100%",
  height: height * 0.55,
})

const $locateButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  position: "absolute",
  top: 60,
  right: 20,
  backgroundColor: colors.tint,
  padding: 10,
  borderRadius: 25,
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 3,
})
