import { observer } from "mobx-react-lite"
import { FC, useEffect, useState } from "react"
import { ActivityIndicator, ImageStyle, View, ViewStyle } from "react-native"
import { type ContentStyle } from "@shopify/flash-list"
import { EmptyState, ListView, Screen, Text } from "@/components"
import { isRTL } from "../i18n"
import { useStores } from "../models"
import { Episode } from "../models/Episode"
import { DemoTabScreenProps } from "../navigators/DemoNavigator"
import type { ThemedStyle } from "@/theme"
import { $styles } from "../theme"
import { delay } from "../utils/delay"
import { useAppTheme } from "@/utils/useAppTheme"

export const UserRewardsScreen: FC<DemoTabScreenProps<"DemoPodcastList">> = observer(
  function UserRewardsScreen(_props) {
    const { episodeStore } = useStores()
    const { themed } = useAppTheme()

    const [refreshing, setRefreshing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // initially, kick off a background refresh without the refreshing UI
    useEffect(() => {
      ;(async function load() {
        setIsLoading(true)
        await episodeStore.fetchEpisodes()
        setIsLoading(false)
      })()
    }, [episodeStore])

    // simulate a longer refresh, if the refresh is too fast for UX
    async function manualRefresh() {
      setRefreshing(true)
      await Promise.all([episodeStore.fetchEpisodes(), delay(750)])
      setRefreshing(false)
    }

    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$styles.flex1}>
        <ListView<Episode>
          contentContainerStyle={themed([$styles.container, $listContentContainer])}
          data={episodeStore.episodesForList.slice()}
          extraData={episodeStore.favorites.length + episodeStore.episodes.length}
          refreshing={refreshing}
          estimatedItemSize={177}
          onRefresh={manualRefresh}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator />
            ) : (
              <EmptyState
                preset="generic"
                style={themed($emptyState)}
                headingTx={
                  episodeStore.favoritesOnly
                    ? "userRewardsScreen:noFavoritesEmptyState.heading"
                    : undefined
                }
                contentTx={
                  episodeStore.favoritesOnly
                    ? "userRewardsScreen:noFavoritesEmptyState.content"
                    : undefined
                }
                button={episodeStore.favoritesOnly ? "" : undefined}
                buttonOnPress={manualRefresh}
                imageStyle={$emptyStateImage}
                ImageProps={{ resizeMode: "contain" }}
              />
            )
          }
          ListHeaderComponent={
            <View style={themed($heading)}>
              <Text preset="heading" tx="userRewardsScreen:title" />
            </View>
          }
        />
      </Screen>
    )
  },
)

// #region Styles
const $listContentContainer: ThemedStyle<ContentStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg + spacing.xl,
  paddingBottom: spacing.lg,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xxl,
})

const $emptyStateImage: ImageStyle = {
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}
// #endregion
