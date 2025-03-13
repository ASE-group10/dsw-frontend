import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { FlatList, View, ViewStyle, StyleSheet } from "react-native"
import { Screen, Text } from "@/components"

// Mock Data
const TOTAL_POINTS = 140 // Total points
const REWARD_ROUTES = [
  { id: "1", start: "Home", end: "Office", points: 50 },
  { id: "2", start: "Office", end: "Gym", points: 30 },
  { id: "3", start: "Gym", end: "Supermarket", points: 20 },
  { id: "4", start: "Supermarket", end: "Home", points: 40 },
]

export const UserRewardsScreen: FC = observer(function UserRewardsScreen() {
  const [refreshing, setRefreshing] = useState(false)

  async function manualRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000) // Simulate refresh
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.screenContainer}>
      {/* Total points */}
      <View style={styles.totalPointsContainer}>
        <Text preset="heading" text="Total Points" />
        <Text preset="subheading" text={`${TOTAL_POINTS}`} />
      </View>

      {/* Daily route points */}
      <FlatList
        data={REWARD_ROUTES}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={manualRefresh}
        renderItem={({ item }) => (
          <View style={styles.routeItem}>
            <Text preset="bold" text={`${item.start} → ${item.end}`} />
            <Text text={`+${item.points} points`} />
          </View>
        )}
      />
    </Screen>
  )
})

// use `StyleSheet.create`
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5", // background color
  },
  totalPointsContainer: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: "#ffcc00",
    alignItems: "center",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  routeItem: {
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
})
