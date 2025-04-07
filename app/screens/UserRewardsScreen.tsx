import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { FlatList, View, Modal, TouchableOpacity, TextStyle, ViewStyle } from "react-native";
import { Screen, Text } from "@/components"
import { Ionicons } from "@expo/vector-icons"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"

// Mock Data
const TOTAL_REWARDS = 9876567
const REWARD_HISTORY = [
  { id: "1", start: "Home", end: "Office", points: 50 },
  { id: "2", start: "Office", end: "Gym", points: 30 },
  { id: "3", start: "Gym", end: "Supermarket", points: 20 },
  { id: "4", start: "Supermarket", end: "Home", points: 40 },
]

export const UserRewardsScreen: FC = observer(function UserRewardsScreen() {
  const { themed, theme } = useAppTheme()
  const [refreshing, setRefreshing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  async function manualRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleRedeemRewards = () => {
    console.log("Redeem Rewards pressed")
  }

  const handleRewardHistory = () => {
    setShowHistory(!showHistory)
  }

  // Render each reward history item
  const renderHistoryItem = ({ item }: { item: (typeof REWARD_HISTORY)[number] }) => (
    <View style={themed($routeItem)}>
      <Text style={themed($routeText)} text={`${item.start} → ${item.end}`} />
      <Text style={themed($pointsText)} text={`+${item.points} points`} />
    </View>
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($screenContainer)}>
      <View style={themed($mainContainer)}>
        {/* Total Rewards */}
        <View style={themed($totalRewardsContainer)}>
          <Text preset="heading" style={themed($headingText)} text="Total Rewards" />
          <View style={themed($rewardsTextContainer)}>
            <Text
              style={themed($totalRewardsText)}
              numberOfLines={1}
              adjustsFontSizeToFit
              text={`${TOTAL_REWARDS}`}
            />
          </View>
        </View>
        {/* Action Buttons */}
        <View style={themed($buttonsContainer)}>
          <TouchableOpacity style={themed($buttonRedeem)} onPress={handleRedeemRewards}>
            <Text style={themed($buttonText)} text="Redeem Rewards" />
          </TouchableOpacity>
          <TouchableOpacity style={themed($buttonHistory)} onPress={handleRewardHistory}>
            <Text style={themed($buttonText)} text="Reward History" />
          </TouchableOpacity>
        </View>

        {/* Reward History List */}
        {showHistory && (
          <>
            <Text style={themed($sectionTitle)} text="Reward History" />
            <FlatList
              data={REWARD_HISTORY}
              keyExtractor={(item) => item.id}
              refreshing={refreshing}
              onRefresh={manualRefresh}
              renderItem={renderHistoryItem}
              contentContainerStyle={themed($routesScrollContainer)}
            />
          </>
        )}

        {/* Help Icon */}
        <TouchableOpacity style={themed($helpIcon)} onPress={() => setShowHelp(true)}>
          <Ionicons name="help-circle" size={50} color={theme.colors.tint} />
        </TouchableOpacity>

        {/* Help Modal */}
        <Modal
          visible={showHelp}
          transparent
          animationType="slide"
          onRequestClose={() => setShowHelp(false)}
        >
          <TouchableOpacity
            style={themed($modalOverlay)}
            activeOpacity={1}
            onPress={() => setShowHelp(false)}
          >
            <View style={themed($modalContent)}>
              <Text style={themed($modalTitle)} text="How Rewards Work" />
              <Text style={themed($modalText)} text="• Earn points by completing trips." />
              <Text style={themed($modalText)} text="• Each route has a reward value." />
              <Text style={themed($modalText)} text="• Redeem rewards for discounts & offers." />
              <Text style={themed($modalText)} text="• Check history to track your rewards." />
              <TouchableOpacity style={themed($closeButton)} onPress={() => setShowHelp(false)}>
                <Text style={themed($closeButtonText)} text="Close" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Screen>
  )
})

// ------------------------- Themed Styles -------------------------

// Screen container
const $screenContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  flex: 1,
  padding: spacing.md,
})

// Main container
const $mainContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "flex-start",
  alignItems: "center",
})

// Total Rewards container
const $totalRewardsContainer: ThemedStyle<ViewStyle> = ({ colors, spacing, isDark }) => ({
  alignItems: "center",
  backgroundColor: isDark ? colors.palette.primary400 : colors.palette.accent500,
  borderRadius: spacing.sm,
  elevation: 5,
  marginBottom: spacing.md,
  paddingVertical: spacing.xl,
  paddingHorizontal: spacing.lg,
  width: "90%",
  minHeight: 160,
})

const $headingText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 22,
  fontWeight: "bold",
  color: colors.text,
})

const $rewardsTextContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
})

const $totalRewardsText: ThemedStyle<TextStyle> = ({ spacing, colors, isDark }) => ({
  fontSize: 26,
  fontWeight: "bold",
  textAlign: "center",
  paddingTop: spacing.md,
  color: isDark ? colors.palette.neutral100 : colors.text,
})

// Buttons container
const $buttonsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "center",
  width: "100%",
  gap: spacing.xs,
  marginBottom: spacing.md,
})

// Redeem button style
const $buttonRedeem: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  alignItems: "center",
  backgroundColor: colors.tint, // using tint for primary actions
  borderRadius: 12,
  elevation: 3,
  flex: 1,
  paddingVertical: spacing.md,
})

// History button style
const $buttonHistory: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  alignItems: "center",
  backgroundColor: colors.border, // using border as a secondary color
  borderRadius: 12,
  elevation: 3,
  flex: 1,
  paddingVertical: spacing.md,
})

// Button text style
const $buttonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100, // white from palette
  fontSize: 18,
  fontWeight: "bold",
  textAlign: "center",
})

// Section title style
const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 22,
  fontWeight: "bold",
  marginBottom: spacing.xs,
  color: colors.text,
})

// FlatList content container style
const $routesScrollContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

// Route item style
const $routeItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  elevation: 3,
  marginBottom: spacing.sm,
  padding: spacing.md,
})

// Route text style
const $routeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.text,
})

// Points text style
const $pointsText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.tint,
  fontWeight: "bold",
})

// Help icon style
const $helpIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  bottom: spacing.md,
  right: spacing.md,
  elevation: 5,
})

// Modal overlay style
const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
})

// Modal content style
const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  padding: spacing.md,
  borderRadius: 12,
  width: "80%",
  alignItems: "center",
  elevation: 5,
})

// Modal title style
const $modalTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: spacing.xs,
  color: colors.text,
})

// Modal text style
const $modalText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  marginBottom: spacing.xxs,
  color: colors.text,
})

// Close button style
const $closeButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.sm,
  backgroundColor: colors.tintInactive,
  padding: spacing.xs,
  borderRadius: 8,
})

// Close button text style
const $closeButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 16,
})
