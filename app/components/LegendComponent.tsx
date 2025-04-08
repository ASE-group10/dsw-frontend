import React, { FC } from "react"
import { View, ViewStyle } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"

export const LegendComponent: FC = () => {
  const { themed, theme } = useAppTheme()

  // Use extra legend tokens if defined in the theme, otherwise fallback to previous literal values.
  const legendCarColor = (theme.colors as any).legendCar || theme.colors.tint
  const legendWalkColor = (theme.colors as any).legendWalk || "#2ecc71"
  const legendBusColor = (theme.colors as any).legendBus || "#f1c40f"
  const legendBikeColor = (theme.colors as any).legendBike || "#9b59b6"

  return (
    <View style={themed($legendContainer)}>
      <View style={themed($legendRow)}>
        <View style={themed($legendItem)}>
          <View style={[themed($legendColor), { backgroundColor: legendCarColor }]} />
          <MaterialCommunityIcons name="car" size={21} color={legendCarColor} />
        </View>
        <View style={themed($legendItem)}>
          <View style={[themed($legendColor), { backgroundColor: legendWalkColor }]} />
          <MaterialCommunityIcons name="walk" size={21} color={legendWalkColor} />
        </View>
        <View style={themed($legendItem)}>
          <View style={[themed($legendColor), { backgroundColor: legendBusColor }]} />
          <MaterialCommunityIcons name="bus" size={21} color={legendBusColor} />
        </View>
        <View style={themed($legendItem)}>
          <View style={[themed($legendColor), { backgroundColor: legendBikeColor }]} />
          <MaterialCommunityIcons name="bike" size={21} color={legendBikeColor} />
        </View>
      </View>
    </View>
  )
}

// Themed style definitions:

const $legendContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $legendRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-evenly",
  marginVertical: spacing.xs,
})

const $legendItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  flexDirection: "row",
  marginHorizontal: spacing.xs,
})

const $legendColor: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  borderRadius: 3,
  height: 16,
  marginRight: spacing.xs,
  width: 16,
})
