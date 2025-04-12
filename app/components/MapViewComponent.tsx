import { FC, useCallback, useEffect, useState } from "react"
import { View, ViewStyle, StyleSheet } from "react-native"
import MapView, { LatLng, Marker, PROVIDER_GOOGLE, Polyline, EdgePadding } from "react-native-maps"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import { Colors } from "@/theme"

const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#242f3e" }],
  },
  // ...other map style configurations...
]

export interface MapViewComponentProps {
  userLocation: LatLng
  mapRef: React.RefObject<MapView>
  followsUser: boolean
  handleMapLongPress: (e: any) => void
  stops: Array<LatLng & { name: string }>
  routePolylines: Array<{ mode: string; coordinates: LatLng[] }>
}

export const MapViewComponent: FC<MapViewComponentProps> = ({
  userLocation,
  mapRef,
  followsUser,
  handleMapLongPress,
  stops,
  routePolylines,
}) => {
  const { themed, theme } = useAppTheme()
  const [isMapReady, setIsMapReady] = useState(false)

  const initialRegion = {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  }

  const recenterMap = useCallback(() => {
    if (mapRef.current && isMapReady) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          zoom: 15,
          pitch: 0,
        },
        { duration: 1000 },
      )
    }
  }, [isMapReady, userLocation])

  useEffect(() => {
    if (isMapReady) {
      recenterMap()
    }
  }, [isMapReady, recenterMap])

  const legalLabelInsets: EdgePadding = {
    top: 0,
    right: 0,
    bottom: -9999,
    left: -9999,
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
        legalLabelInsets={legalLabelInsets}
        rotateEnabled={true}
        customMapStyle={theme.isDark ? darkMapStyle : []}
        minZoomLevel={5}
        maxZoomLevel={20}
        loadingEnabled={true}
        loadingIndicatorColor={theme.colors.tint}
        onMapReady={() => {
          setIsMapReady(true)
        }}
      >
        {isMapReady &&
          stops.map((stop, index) => (
            <Marker
              key={`${stop.latitude}-${stop.longitude}-${index}`}
              coordinate={stop}
              title={stop.name}
            />
          ))}
        {isMapReady &&
          routePolylines.map((polyline, index) => (
            <Polyline
              key={index}
              coordinates={polyline.coordinates}
              strokeWidth={3}
              strokeColor={
                polyline.mode === "walk"
                  ? theme.colors.error
                  : polyline.mode === "bus"
                    ? theme.colors.tint
                    : theme.colors.primary
              }
            />
          ))}
      </MapView>
    </View>
  )
}

const $container = ({ colors }: { colors: Colors }): ViewStyle => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $map = (): ViewStyle => ({
  ...StyleSheet.absoluteFillObject,
})
