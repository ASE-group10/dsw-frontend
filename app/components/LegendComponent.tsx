import React, { FC } from "react"
import { View, ViewStyle } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

export const LegendComponent: FC = () => {
  return (
    <View style={styles.legendContainer}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#007AFF" }]} />
          <MaterialCommunityIcons name="car" size={21} color="#007AFF" />
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#2ecc71" }]} />
          <MaterialCommunityIcons name="walk" size={21} color="#2ecc71" />
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#f1c40f" }]} />
          <MaterialCommunityIcons name="bus" size={21} color="#f1c40f" />
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#9b59b6" }]} />
          <MaterialCommunityIcons name="bike" size={21} color="#9b59b6" />
        </View>
      </View>
    </View>
  )
}

const styles = {
  legendContainer: {
    marginBottom: 6,
  } as ViewStyle,
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 6,
  } as ViewStyle,
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    marginHorizontal: 6,
  } as ViewStyle,
  legendColor: {
    borderRadius: 3,
    height: 16,
    marginRight: 4,
    width: 16,
  } as ViewStyle,
}
