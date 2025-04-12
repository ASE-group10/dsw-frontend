import { ConfigPlugin, withAndroidManifest } from "@expo/config-plugins"

const withMapsApiKey: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest

    if (!androidManifest.application) {
      androidManifest.application = [
        {
          "$": {
            "android:name": ".MainApplication",
          },
          "meta-data": [],
        },
      ]
    }

    const mainApplication = androidManifest.application[0]
    if (!mainApplication["meta-data"]) {
      mainApplication["meta-data"] = []
    }

    const existingMetaData = mainApplication["meta-data"].find(
      (item) => item.$?.["android:name"] === "com.google.android.geo.API_KEY",
    )

    if (!existingMetaData) {
      mainApplication["meta-data"].push({
        $: {
          "android:name": "com.google.android.geo.API_KEY",
          "android:value": config.extra?.MAPS_API_KEY || "",
        },
      })
    }

    return config
  })
}

export default withMapsApiKey
