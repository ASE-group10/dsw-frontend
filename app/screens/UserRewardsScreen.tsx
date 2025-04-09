import { observer } from "mobx-react-lite"
import React, { FC, useCallback, useEffect, useRef, useState } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { Screen, Text } from "@/components"
import { Ionicons } from "@expo/vector-icons"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { apiReward } from "@/services/api"

// ---------------------------------
// Themed styles
// ---------------------------------
import { ViewStyle, TextStyle } from "react-native"

const GAP_BETWEEN_TABS = 0 // set to e.g. 16 if you want an actual gap

export const UserRewardsScreen: FC = observer(function UserRewardsScreen() {
  const { themed, theme } = useAppTheme()

  // -------------------------
  // State
  // -------------------------
  const [rewardsHistory, setRewardsHistory] = useState<any[]>([])
  const [totalRewards, setTotalRewards] = useState(0)

  const [eligibleCoupons, setEligibleCoupons] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loadingCoupons, setLoadingCoupons] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  // Animated value for left/right translation
  const tabAnim = useRef(new Animated.Value(0)).current

  // Keep track of the measured width for our tabs
  const [containerWidth, setContainerWidth] = useState(0)

  // -------------------------
  // API Calls
  // -------------------------
  const fetchRewardsHistory = useCallback(async () => {
    try {
      const response = await apiReward.getRewardsHistory()
      if (response.ok && response.data) {
        setRewardsHistory(response.data)
        // We no longer calculate totalRewards here
        // Total rewards are fetched by fetchTotalRewards instead.
      } else {
        console.warn("Error fetching rewards history:", response.problem, response.data)
      }
    } catch (err) {
      console.error("Exception fetching rewards history:", err)
    }
  }, [])

  const fetchTotalRewards = useCallback(async () => {
    try {
      const response = await apiReward.getTotalRewards()
      if (response.ok && response.data) {
        // Assuming your API returns an object with a 'totalPoints' field
        setTotalRewards(response.data.totalPoints)
      } else {
        console.warn("Error fetching total rewards:", response.problem, response.data)
      }
    } catch (err) {
      console.error("Exception fetching total rewards:", err)
    }
  }, [])

  const fetchEligibleCoupons = useCallback(async () => {
    try {
      setLoadingCoupons(true)
      const response = await apiReward.getEligibleCoupons()
      setLoadingCoupons(false)
      if (response.ok && response.data) {
        setEligibleCoupons(response.data)
      } else {
        console.warn("Error fetching eligible coupons:", response.problem, response.data)
        Alert.alert("Error", "Unable to fetch eligible coupons.")
      }
    } catch (err) {
      setLoadingCoupons(false)
      console.error("Exception fetching eligible coupons:", err)
      Alert.alert("Error", "Unable to fetch eligible coupons.")
    }
  }, [])

  const fetchAllData = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchTotalRewards(), fetchRewardsHistory(), fetchEligibleCoupons()])
    setRefreshing(false)
  }, [fetchTotalRewards, fetchRewardsHistory, fetchEligibleCoupons])

  const redeemCoupon = useCallback(
    async (couponId: string) => {
      try {
        const response = await apiReward.redeemCoupon(couponId)
        if (response.ok) {
          Alert.alert("Success", "Coupon redeemed successfully!")
          fetchAllData() // refresh
        } else {
          const message = response.data?.message || "Unable to redeem coupon."
          Alert.alert("Error", message)
        }
      } catch (err) {
        console.error("Exception redeeming coupon:", err)
        Alert.alert("Error", "Unable to redeem coupon.")
      }
    },
    [fetchAllData],
  )

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // -------------------------
  // Animation
  // -------------------------
  const handleTabPress = useCallback(
    (tabIndex: number) => {
      setActiveTab(tabIndex)
      Animated.spring(tabAnim, {
        toValue: -tabIndex * (containerWidth + GAP_BETWEEN_TABS),
        useNativeDriver: true,
      }).start()
    },
    [containerWidth],
  )

  // -------------------------
  // Render
  // -------------------------
  const renderHistoryItem = ({ item }: { item: any }) => {
    return (
      <View style={themed($rewardItem)}>
        {/* <Text style={themed($rewardItemText)} text={`Reward ID: ${item.id}`} /> */}
        <Text style={themed($rewardPointsText)} text={`+${item.points} points`} />
      </View>
    )
  }

  const renderCouponItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={themed($couponItem)}
        onPress={() => {
          Alert.alert(
            "Redeem Coupon",
            `Are you sure you want to redeem coupon "${item.couponId}"?`,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Yes", onPress: () => redeemCoupon(item.couponId) },
            ],
          )
        }}
      >
        <Text
          style={themed($couponText)}
          text={`${item.couponId} - ${item.couponDesc} (Requires ${item.requiredPoints} pts)`}
        />
      </TouchableOpacity>
    )
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      // Remove horizontal padding from the entire Screen so the measuring width is accurate:
      contentContainerStyle={themed($screenContainer)}
      style={{ flex: 1 }}
    >
      {/* Top Section: Total Rewards */}
      <View style={themed($topContainer)}>
        <Text preset="heading" style={themed($headingText)} text="Total Rewards" />
        <Text style={themed($totalPointsText)} text={`${totalRewards} pts`} />
      </View>

      {/* This container has no horizontal padding, so the onLayout will
          measure the true available width for the tabs. */}
      <View
        style={{ flex: 1 }}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout
          setContainerWidth(width)
        }}
      >
        {/* Tab Buttons */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 0 && styles.activeTabButton]}
            onPress={() => handleTabPress(0)}
          >
            <Text style={themed($tabButtonText)} text="Reward History" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 1 && styles.activeTabButton]}
            onPress={() => handleTabPress(1)}
          >
            <Text style={themed($tabButtonText)} text="Eligible Coupons" />
          </TouchableOpacity>
        </View>

        {/* Animated container with 2 sub-views (and optional gap) */}
        <Animated.View
          style={{
            flexDirection: "row",
            // If you want a gap, add GAP_BETWEEN_TABS to the total width
            width: containerWidth * 2 + GAP_BETWEEN_TABS,
            transform: [{ translateX: tabAnim }],
          }}
        >
          {/* HISTORY TAB */}
          <View style={{ width: containerWidth }}>
            <FlatList
              data={rewardsHistory}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderHistoryItem}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={fetchAllData}
                  colors={[theme.colors.tint]}
                />
              }
              contentContainerStyle={themed($tabContentContainer)}
              ListEmptyComponent={
                <Text style={themed($emptyListText)} text="No reward history found." />
              }
            />
          </View>

          {GAP_BETWEEN_TABS > 0 && (
            <View style={{ width: GAP_BETWEEN_TABS, backgroundColor: "transparent" }} />
          )}

          {/* COUPONS TAB */}
          <View style={{ width: containerWidth }}>
            {loadingCoupons ? (
              <ActivityIndicator size="large" color={theme.colors.tint} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={eligibleCoupons}
                keyExtractor={(item) => item.couponId}
                renderItem={renderCouponItem}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing && !loadingCoupons}
                    onRefresh={fetchAllData}
                    colors={[theme.colors.tint]}
                  />
                }
                contentContainerStyle={themed($tabContentContainer)}
                ListEmptyComponent={
                  <Text style={themed($emptyListText)} text="No eligible coupons found." />
                }
              />
            )}
          </View>
        </Animated.View>
      </View>

      {/* Floating Help Icon */}
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
            <Text style={themed($modalBodyText)} text="• Earn points by completing trips." />
            <Text style={themed($modalBodyText)} text="• Each route has a reward value." />
            <Text style={themed($modalBodyText)} text="• Redeem rewards for discounts & offers." />
            <Text style={themed($modalBodyText)} text="• Check history to track your rewards." />
            <TouchableOpacity style={themed($closeButton)} onPress={() => setShowHelp(false)}>
              <Text style={themed($closeButtonText)} text="Close" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  )
})

const styles = StyleSheet.create({
  activeTabButton: {
    borderBottomWidth: 3,
    borderColor: "#007bff",
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
})

// Outer screen container with NO horizontal padding
const $screenContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  flexGrow: 1,
  // We remove horizontal padding here so that onLayout can measure full width
  // If you prefer some vertical spacing, keep paddingVertical:
  paddingVertical: spacing.md,
})

// The top container for the total rewards
const $topContainer: ThemedStyle<ViewStyle> = ({ colors, spacing, isDark }) => ({
  alignItems: "center",
  backgroundColor: isDark ? colors.palette.primary400 : colors.palette.accent500,
  borderRadius: spacing.sm,
  elevation: 5,
  marginHorizontal: spacing.md, // If you want left-right spacing just for the top section
  marginBottom: spacing.md,
  paddingVertical: spacing.xl,
  paddingHorizontal: spacing.lg,
})

// Title text
const $headingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 22,
  fontWeight: "bold",
  color: colors.text,
})

// The total reward points text
const $totalPointsText: ThemedStyle<TextStyle> = ({ colors, spacing, isDark }) => ({
  fontSize: 26,
  fontWeight: "bold",
  marginTop: spacing.sm,
  paddingTop: spacing.md,
  color: isDark ? colors.palette.neutral100 : colors.text,
})

// The content container for tab items
const $tabContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
  // We can add small horizontal padding so items don’t touch the screen edges
  paddingHorizontal: spacing.md,
})

// A single item in the "Reward History"
const $rewardItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  elevation: 3,
  marginBottom: spacing.sm,
  padding: spacing.md,
})

const $rewardItemText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.text,
})

const $rewardPointsText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "bold",
  color: colors.tint,
})

// A single item in the "Eligible Coupons"
const $couponItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderColor: colors.border,
  borderWidth: 1,
  borderRadius: 8,
  marginVertical: spacing.xs,
  padding: spacing.sm,
})

const $couponText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.text,
})

// If the list is empty
const $emptyListText: ThemedStyle<TextStyle> = ({ colors }) => ({
  textAlign: "center",
  color: colors.text,
  marginTop: 20,
})

// Floating help icon
const $helpIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  bottom: spacing.md,
  right: spacing.md,
  elevation: 5,
})

// Modal overlay
const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
})

// The modal content
const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  padding: spacing.md,
  borderRadius: 12,
  width: "80%",
  maxHeight: "80%",
  alignItems: "center",
  elevation: 5,
})

const $modalTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: 8,
  color: colors.text,
})

const $modalBodyText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  marginBottom: 5,
  color: colors.text,
})

const $closeButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.sm,
  backgroundColor: colors.tintInactive,
  padding: spacing.xs,
  borderRadius: 8,
})

const $closeButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 16,
})

export const $tabButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
})
