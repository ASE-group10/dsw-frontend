import React, { FC } from "react"
import { Dimensions, ViewStyle } from "react-native"
import MapView, { Marker, UrlTile, Polyline, MapEvent } from "react-native-maps"

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
  return (
    <MapView
      ref={mapRef}
      style={$map}
      initialRegion={{
        latitude: userLocation.latitude - 0.002,
        longitude: userLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }}
      showsUserLocation={true}
      followsUserLocation={followsUser}
      onLongPress={handleMapLongPress}
      legalLabelInsets={{ bottom: -9999, left: -9999 }}
      rotateEnabled={true}
    >
      <UrlTile
        urlTemplate="https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=lko7A40ouEx25V2jU3MkC8xKI0Dme2rbWsQQVSe6zXUqnhTMepLHw8ztXXXYuVcO"
        maximumZ={19}
        flipY={false}
      />

      {/* Render Markers for stops */}
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

      {/* Render Polylines for each segment */}
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
  )
}
