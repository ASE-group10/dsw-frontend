import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { FlatList, View, StyleSheet, TouchableOpacity, Modal } from "react-native"
import { Screen, Text } from "@/components"
import { Ionicons } from "@expo/vector-icons" // Importing the help icon

// Color constants
const COLORS = {
  background: "#f5f5f5",
  primary: "#007bff",
  secondary: "#0056b3",
  highlight: "#ffcc00",
  white: "#ffffff",
  text: "#333333",
  shadow: "#cccccc",
}

// Mock Data
const TOTAL_REWARDS = 140 // Total rewards
const REWARD_HISTORY = [
  { id: "1", start: "Home", end: "Office", points: 50 },
  { id: "2", start: "Office", end: "Gym", points: 30 },
  { id: "3", start: "Gym", end: "Supermarket", points: 20 },
  { id: "4", start: "Supermarket", end: "Home", points: 40 },
]

export const UserRewardsScreen: FC = observer(function UserRewardsScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showHelp, setShowHelp] = useState(false) // State for help modal

  async function manualRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000) // Simulate refresh
  }

  const handleRedeemRewards = () => {
    console.log("Redeem Rewards pressed")
  }

  const handleRewardHistory = () => {
    setShowHistory(!showHistory)
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.screenContainer}>
      <View style={styles.mainContainer}>
        {/* Total Rewards */}
        <View style={styles.totalRewardsContainer}>
          <Text preset="heading" style={styles.headingText} text="Total Rewards" />
          <View style={styles.rewardsTextContainer}>
            <Text
              style={styles.totalRewardsText}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              text={`${TOTAL_REWARDS}`}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.buttonRedeem} onPress={handleRedeemRewards}>
            <Text style={styles.buttonText} text="Redeem Rewards" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonHistory} onPress={handleRewardHistory}>
            <Text style={styles.buttonText} text="Reward History" />
          </TouchableOpacity>
        </View>

        {/* Show Reward History only when the button is clicked */}
        {showHistory && (
          <>
            <Text style={styles.sectionTitle} text="Reward History" />
            <FlatList
              data={REWARD_HISTORY}
              keyExtractor={(item) => item.id}
              refreshing={refreshing}
              onRefresh={manualRefresh}
              renderItem={({ item }) => (
                <View style={styles.routeItem}>
                  <Text style={styles.routeText} text={`${item.start} → ${item.end}`} />
                  <Text style={styles.pointsText} text={`+${item.points} points`} />
                </View>
              )}
            />
          </>
        )}

        {/* Help Icon (❓) */}
        <TouchableOpacity style={styles.helpIcon} onPress={() => setShowHelp(true)}>
          <Ionicons name="help-circle" size={50} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Help Modal */}
        <Modal visible={showHelp} transparent={true} animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle} text="How Rewards Work" />
              <Text style={styles.modalText} text="• Earn points by completing trips." />
              <Text style={styles.modalText} text="• Each route has a reward value." />
              <Text style={styles.modalText} text="• Redeem rewards for discounts & offers." />
              <Text style={styles.modalText} text="• Check history to track your rewards." />
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowHelp(false)}>
                <Text style={styles.closeButtonText} text="Close" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  )
})

// use `StyleSheet.create`
const styles = StyleSheet.create({
  screenContainer: {
    backgroundColor: COLORS.background,
    flex: 1,
    padding: 16,
  },
  mainContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  totalRewardsContainer: {
    alignItems: "center",
    backgroundColor: COLORS.highlight,
    borderRadius: 12,
    elevation: 5,
    marginBottom: 20,
    paddingVertical: 40,
    paddingHorizontal: 24,
    width: "90%",
  },
  headingText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 5,
  },
  rewardsTextContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  totalRewardsText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 12,
    marginBottom: 20,
  },
  buttonRedeem: {
    alignItems: "center",
    backgroundColor: "#28a745",
    borderRadius: 12,
    elevation: 3,
    flex: 1,
    paddingVertical: 18,
  },
  buttonHistory: {
    alignItems: "center",
    backgroundColor: "#6c757d",
    borderRadius: 12,
    elevation: 3,
    flex: 1,
    paddingVertical: 18,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: COLORS.text,
  },
  routeItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 10,
    padding: 16,
  },
  helpIcon: {
    position: "absolute",
    bottom: 20,
    right: 20,
    elevation: 5,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 16,
  },
})
