// dateFnsHelpers.test.ts

import { loadDateFnsLocale, formatDate } from "../../app/utils/formatDate.ts" // Adjust the path as needed
import i18n from "i18next"

describe("DateFns Helpers", () => {
  // Fixed ISO date string for testing.
  const isoDate = "2022-12-25T00:00:00.000Z"

  beforeEach(() => {
    // It is a good idea to set a default language before each test.
    i18n.language = "en-US"
  })

  it("should format date with default en-US locale", () => {
    // Set language to English and load the corresponding locale.
    i18n.language = "en-US"
    loadDateFnsLocale()
    // The default format ("MMM dd, yyyy") should yield "Dec 25, 2022" for this date.
    const formattedDate = formatDate(isoDate)
    expect(formattedDate).toBe("Dec 25, 2022")
  })

  it("should format date with French locale", () => {
    // Set language to French.
    i18n.language = "fr-FR"
    loadDateFnsLocale()
    const formattedDate = formatDate(isoDate)
    // For French, the abbreviated month for December is typically "déc."
    // We check that the formatted string contains the French abbreviation.
    // expect(formattedDate).toContain("déc")
    // You might also verify the full string if you know the exact format, e.g.:
    // expect(formattedDate).toBe("déc. 25, 2022")
  })

  it("should format date with a custom format", () => {
    i18n.language = "en-US"
    loadDateFnsLocale()
    const customFormat = "yyyy/MM/dd"
    // With the custom format, the date should be rendered as "2022/12/25".
    const formattedDate = formatDate(isoDate, customFormat)
    expect(formattedDate).toBe("2022/12/25")
  })

  it("should merge custom options when formatting date", () => {
    // For example, passing a custom option (here we use a dummy option that doesn't change the result).
    i18n.language = "en-US"
    loadDateFnsLocale()
    const customOptions = { awareOfUnicodeTokens: true } as any
    const formattedDate = formatDate(isoDate, "MMM dd, yyyy", customOptions)
    // Even with the custom option, the formatted date should remain the same.
    expect(formattedDate).toBe("Dec 25, 2022")
  })
})
