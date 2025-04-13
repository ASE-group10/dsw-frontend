import { View, StyleSheet } from "react-native"
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps"

export const MapScreen = () => {
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE} // Use Google Maps
        style={styles.map}
        initialRegion={{
          latitude: 53.3498, // Example: Dublin
          longitude: -6.2603,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker coordinate={{ latitude: 53.3498, longitude: -6.2603 }} title="Dublin" />
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
})

export default MapScreen
