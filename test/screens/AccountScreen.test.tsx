import React from "react"
import { render } from "@testing-library/react-native"
import { AccountScreen } from "../../app/screens/AccountScreen"
import { TestWrapper } from "../utils/TestWrapper"

describe("AccountScreen", () => {
  it("should render correctly", () => {
    const { getByText } = render(
      <TestWrapper>
        <AccountScreen />
      </TestWrapper>
    )
    expect(getByText("Account")).toBeTruthy()
  })
})
