import React, { FC, useRef, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
} from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"

// Define the mode icons mapping.
const modeIcons: { [key: string]: string } = {
  car: "car-outline",
  walk: "walk",
  bus: "bus",
  cycle: "bike",
}

interface StopItemProps {
  stop: { latitude: number; longitude: number; name: string }
  index: number
  totalStops: number
  selectedMode?: string
  onRemove: (index: number) => void
  onSelectMode: (index: number, mode: string) => void
  disableRemove?: boolean
}

export const StopItem: FC<StopItemProps> = ({
  stop,
  index,
  totalStops,
  selectedMode,
  onRemove,
  onSelectMode,
  disableRemove,
}) => {
  const { themed, theme } = useAppTheme()
  const [expanded, setExpanded] = useState<boolean>(false)
  const dropdownAnim = useRef(new Animated.Value(0)).current

  const toggleDropdown = () => {
    if (expanded) {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start(() => setExpanded(false))
    } else {
      setExpanded(true)
      Animated.timing(dropdownAnim, {
        toValue: 50,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start()
    }
  }

  // Do not show mode selector if this is the last stop.
  const isLastStop = index === totalStops - 1

  return (
    <View style={themed($stopItemContainer)}>
      <View style={themed($stopTopRow)}>
        <Text style={themed($stopTitle)}>{`Stop ${index + 1}: ${stop.name}`}</Text>
        {!disableRemove && (
          <TouchableOpacity onPress={() => onRemove(index)}>
            <MaterialCommunityIcons
              name="minus-circle-outline"
              size={20}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        )}
      </View>

      {!isLastStop && (
        <>
          <View style={themed($modeSelectionRow)}>
            <TouchableOpacity style={themed($modeIconButton)} onPress={toggleDropdown}>
              <MaterialCommunityIcons
                name={modeIcons[selectedMode || "car"]}
                size={24}
                color={theme.colors.tint}
              />
            </TouchableOpacity>
          </View>

          {expanded && (
            <Animated.View style={[themed($modeDropdown), { height: dropdownAnim }]}>
              <View style={themed($modeButtonRow)}>
                {Object.keys(modeIcons).map((modeKey) => {
                  const isActive = selectedMode === modeKey
                  return (
                    <TouchableOpacity
                      key={modeKey}
                      style={[
                        themed($modeOptionButton),
                        isActive ? themed($activeModeOption) : themed($inactiveModeOption),
                      ]}
                      onPress={() => {
                        onSelectMode(index, modeKey)
                        toggleDropdown()
                      }}
                    >
                      <MaterialCommunityIcons
                        name={modeIcons[modeKey]}
                        size={20}
                        color={isActive ? theme.colors.palette.neutral100 : theme.colors.text}
                      />
                    </TouchableOpacity>
                  )
                })}
              </View>
            </Animated.View>
          )}
        </>
      )}
    </View>
  )
}

// --------------------- THEMED STYLE DEFINITIONS --------------------- //

const $stopItemContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginBottom: spacing.md,
  backgroundColor: colors.background,
  borderRadius: spacing.xs,
  padding: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
})

const $stopTopRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xs,
})

const $stopTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  maxWidth: "80%",
  color: colors.text,
  // Optionally, you can use a fontFamily from typography:
  // fontFamily: typography.primary.normal,
})

const $modeSelectionRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.xs,
})

const $modeIconButton: ThemedStyle<ViewStyle> = () => ({
  padding: 6,
})

const $modeDropdown: ThemedStyle<ViewStyle> = () => ({
  overflow: "hidden",
})

const $modeButtonRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  marginTop: spacing.xs,
  justifyContent: "flex-start",
  flexWrap: "wrap",
})

const $modeOptionButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: 6,
  marginRight: spacing.sm,
  marginBottom: spacing.sm,
  borderRadius: 5,
})

const $activeModeOption: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint, // Active mode background uses theme's tint color
})

const $inactiveModeOption: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.border, // Inactive mode background uses theme's border color
})
