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
  onUserCameraChange?: (isControlled: boolean, zoom: number, pitch: number) => void
}

export const MapViewComponent: FC<MapViewComponentProps> = ({
  userLocation,
  mapRef,
  followsUser,
  handleMapLongPress,
  stops,
  routePolylines,
  onUserCameraChange,
}) => {
  const { themed, theme } = useAppTheme()
  const [isMapReady, setIsMapReady] = useState(false)
  const [userInteracting, setUserInteracting] = useState(false)
  const [prevRouteLength, setPrevRouteLength] = useState(0)
  const [prevStopsLength, setPrevStopsLength] = useState(0)

  // Use the same colors as defined in LegendComponent
  const transportModeColors = {
    car: (theme.colors as any).legendCar || theme.colors.tint,
    walk: (theme.colors as any).legendWalk || "#2ecc71",
    bus: (theme.colors as any).legendBus || "#f1c40f",
    bike: (theme.colors as any).legendBike || "#9b59b6",
  }

  const getPolylineColor = (mode: string) => {
    return transportModeColors[mode as keyof typeof transportModeColors] || theme.colors.tint
  }

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

  // Function to fit map to show all stops and route
  const fitMapToRoute = useCallback(() => {
    if (mapRef.current && isMapReady && (stops.length > 0 || routePolylines.length > 0)) {
      console.log('[MAP] Fitting map to route with stops:', stops.length, 'polylines:', routePolylines.length);
      
      try {
        // Collect all coordinates to include in the viewport
        const allCoordinates: LatLng[] = [];
        
        // Add all stops
        stops.forEach(stop => {
          allCoordinates.push({
            latitude: stop.latitude,
            longitude: stop.longitude
          });
        });
        
        // Add all polyline points
        routePolylines.forEach(polyline => {
          polyline.coordinates.forEach(coord => {
            allCoordinates.push({
              latitude: coord.latitude,
              longitude: coord.longitude
            });
          });
        });
        
        // If we have coordinates, fit the map to them
        if (allCoordinates.length > 0) {
          console.log('[MAP] Fitting to', allCoordinates.length, 'coordinates');
          
          // Add some padding on iOS to account for the bottom sheet
          const edgePadding = {
            top: 50,
            right: 50,
            bottom: 200,  // Extra padding at bottom for the sheet
            left: 50
          };
          
          mapRef.current.fitToCoordinates(
            allCoordinates,
            {
              edgePadding,
              animated: true
            }
          );
        }
      } catch (error) {
        console.error('[MAP] Error fitting map to route:', error);
      }
    }
  }, [isMapReady, stops, routePolylines]);

  useEffect(() => {
    if (isMapReady) {
      recenterMap()
    }
  }, [isMapReady, recenterMap])

  // Effect to detect changes in route or stops and fit the map accordingly
  useEffect(() => {
    if (isMapReady) {
      // Check if the route or stops have changed
      const routeChanged = routePolylines.length !== prevRouteLength;
      const stopsChanged = stops.length !== prevStopsLength;
      
      // If either has changed, fit the map to show everything
      if (routeChanged || stopsChanged) {
        console.log('[MAP] Route or stops changed, fitting map view');
        
        // Short delay to ensure all markers and polylines are rendered
        setTimeout(() => {
          fitMapToRoute();
        }, 500);
        
        // Update the previous counts
        setPrevRouteLength(routePolylines.length);
        setPrevStopsLength(stops.length);
      }
    }
  }, [isMapReady, routePolylines, stops, prevRouteLength, prevStopsLength, fitMapToRoute]);

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
        onPanDrag={() => {
          // User is manually panning the map
          setUserInteracting(true);
        }}
        onRegionChangeComplete={(region, { isGesture }) => {
          // Only consider it user interaction if it was from a gesture
          if (isGesture && onUserCameraChange) {
            // Calculate zoom level from delta
            const zoom = Math.log2(360 / region.longitudeDelta) + 1;
            // Get current camera position for pitch
            mapRef.current?.getCamera().then(camera => {
              if (onUserCameraChange) {
                onUserCameraChange(true, zoom, camera.pitch || 45);
              }
            });
          }
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
              strokeColor={getPolylineColor(polyline.mode)}
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
