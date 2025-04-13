import React from "react"
import { render } from "@testing-library/react-native"
import { Text } from "../../app/components/Text"

describe("Text component", () => {
  it("renders plain text from `text` prop", () => {
    const testText = "Hello from prop"
    const { getByText } = render(<Text text={testText} />)
    expect(getByText(testText)).toBeTruthy()
  })

  it("renders children if `text` prop is not provided", () => {
    const childText = "Hello from children"
    const { getByText } = render(<Text>{childText}</Text>)
    expect(getByText(childText)).toBeTruthy()
  })

  it("renders translated string from `tx` prop", () => {
    const { getByText } = render(<Text tx="loginScreen:logIn" />)
    expect(getByText("Log In")).toBeTruthy()
  })

  it("renders fallback key if tx key not found", () => {
    const fallbackKey = "nonexistent:key"
    const { getByText } = render(<Text tx={fallbackKey} />)
    expect(getByText(fallbackKey)).toBeTruthy()
  })
})
