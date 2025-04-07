import React, { FC, useCallback, useState } from "react"
import { Dimensions, TouchableOpacity, ViewStyle, StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  UrlTile,
  Polyline,
  MapEvent,
  PROVIDER_GOOGLE,
} from "react-native-maps"
import { useFocusEffect } from "@react-navigation/native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

const { height } = Dimensions.get("window")

// Define a style for the MapView.
const $map: ViewStyle = {
  flex: 1,
  width: "100%",
  height: height * 0.55, // same height as before
}

// Define the props needed by the MapViewComponent.
interface MapViewComponentProps {
  userLocation: { latitude: number; longitude: number }
  mapRef: React.RefObject<MapView>
  followsUser: boolean
  handleMapLongPress: (e: MapEvent) => void
  stops: { latitude: number; longitude: number; name: string }[]
  routePolylines: { mode: string; coordinates: { latitude: number; longitude: number }[] }[]
}

export const MapViewComponent: FC<MapViewComponentProps> = ({
  userLocation,
  mapRef,
  followsUser,
  handleMapLongPress,
  stops,
  routePolylines,
}) => {
  // const [isMapReady, setIsMapReady] = useState(false)
  //
  // // Mark the map as ready
  // const handleMapReady = useCallback(() => {
  //   setIsMapReady(true)
  // }, [])
  //
  // // Reapply padding only if the map is actually ready
  // useFocusEffect(
  //   useCallback(() => {
  //     if (isMapReady && mapRef.current) {
  //       mapRef.current.setNativeProps({
  //         mapPadding: { top: 0, right: 0, bottom: 50, left: 0 },
  //       })
  //     }
  //   }, [isMapReady, mapRef]),
  // )
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
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        style={styles.map}
        // onMapReady={handleMapReady}
        initialRegion={initialRegion}
        showsMyLocationButton={false}
        showsUserLocation={true}
        followsUserLocation={followsUser}
        onLongPress={handleMapLongPress}
        legalLabelInsets={{ bottom: -9999, left: -9999 }}
        rotateEnabled={true}
        // mapPadding={{ top: 0, right: 0, bottom: 50, left: 0 }}
      >
        {/* Markers, Polylines, and other MapView-specific children are OK */}
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
        <UrlTile
          urlTemplate="https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=lko7A40ouEx25V2jU3MkC8xKI0Dme2rbWsQQVSe6zXUqnhTMepLHw8ztXXXYuVcO"
          maximumZ={19}
          flipY={false}
        />
      </MapView>

      {/* Move the custom locate button OUTSIDE the MapView */}
      <TouchableOpacity style={styles.locateButton} onPress={recenterMap}>
        <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  locateButton: {
    position: "absolute",
    top: 60, // Adjust as needed to move the button down
    right: 20,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 25,
    elevation: 5, // For Android shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
})
