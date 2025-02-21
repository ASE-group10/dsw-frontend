import "dotenv/config" // Loads .env variables into process.env
import fs from "fs"
import path from "path"

// Path to AndroidManifest.xml
const manifestPath = path.join(__dirname, "../android/app/src/main/AndroidManifest.xml")

// Load API key from .env
const apiKey = process.env.MAPS_API_KEY

if (!apiKey) {
  console.error("❌ ERROR: MAPS_API_KEY is missing. Set it in your .env file.")
  process.exit(1)
}

// Read AndroidManifest.xml
fs.readFile(manifestPath, "utf8", (err, data) => {
  if (err) {
    console.error(`❌ ERROR: Could not read AndroidManifest.xml: ${err.message}`)
    process.exit(1)
  }

  // Check if the API key is already added
  if (data.includes('android:name="com.google.android.geo.API_KEY"')) {
    console.log("✅ API key already exists in AndroidManifest.xml")
    return
  }

  // Insert API key **inside** <application> tag
  const updatedData = data.replace(
    /<application(.*?)>/,
    `<application$1>\n    <meta-data android:name="com.google.android.geo.API_KEY" android:value="${apiKey}"/>`,
  )

  // Write back to AndroidManifest.xml
  fs.writeFile(manifestPath, updatedData, "utf8", (err) => {
    if (err) {
      console.error(`❌ ERROR: Could not write to AndroidManifest.xml: ${err.message}`)
      process.exit(1)
    }
    console.log("✅ Successfully added API key to AndroidManifest.xml")
  })
})
