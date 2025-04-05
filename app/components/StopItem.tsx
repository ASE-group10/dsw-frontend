import React, { FC, useRef, useState } from "react"
import { View, Text, TouchableOpacity, Animated, Easing, ViewStyle } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

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

  // If this is the last stop, do not show the mode selector.
  const isLastStop = index === totalStops - 1

  return (
    <View style={styles.stopItemContainer}>
      <View style={styles.stopTopRow}>
        <Text style={styles.stopTitle}>{`Stop ${index + 1}: ${stop.name}`}</Text>
        {!disableRemove && (
          <TouchableOpacity onPress={() => onRemove(index)}>
            <MaterialCommunityIcons name="minus-circle-outline" size={20} color="#FF6347" />
          </TouchableOpacity>
        )}
      </View>

      {!isLastStop && (
        <>
          <View style={styles.modeSelectionRow}>
            <TouchableOpacity style={styles.modeIconButton} onPress={toggleDropdown}>
              <MaterialCommunityIcons
                name={modeIcons[selectedMode || "car"]}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
          </View>

          {expanded && (
            <Animated.View style={[styles.modeDropdown, { height: dropdownAnim }]}>
              <View style={styles.modeButtonRow}>
                {Object.keys(modeIcons).map((modeKey) => {
                  const isActive = selectedMode === modeKey
                  return (
                    <TouchableOpacity
                      key={modeKey}
                      style={[
                        styles.modeOptionButton,
                        isActive ? styles.activeModeOption : styles.inactiveModeOption,
                      ]}
                      onPress={() => {
                        onSelectMode(index, modeKey)
                        toggleDropdown()
                      }}
                    >
                      <MaterialCommunityIcons
                        name={modeIcons[modeKey]}
                        size={20}
                        color={isActive ? "#fff" : "#333"}
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

const styles = {
  stopItemContainer: {
    marginBottom: 12,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#eee",
  } as ViewStyle,
  stopTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  } as ViewStyle,
  stopTitle: {
    fontSize: 16,
    fontWeight: "600",
    maxWidth: "80%",
  } as ViewStyle,
  modeSelectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  } as ViewStyle,
  modeIconButton: {
    padding: 6,
  } as ViewStyle,
  modeDropdown: {
    overflow: "hidden",
  } as ViewStyle,
  modeButtonRow: {
    flexDirection: "row",
    marginTop: 6,
    justifyContent: "flex-start",
    flexWrap: "wrap",
  } as ViewStyle,
  modeOptionButton: {
    padding: 6,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 5,
  } as ViewStyle,
  activeModeOption: {
    backgroundColor: "#007AFF",
  } as ViewStyle,
  inactiveModeOption: {
    backgroundColor: "#eee",
  } as ViewStyle,
}
