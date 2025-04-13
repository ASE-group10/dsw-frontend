import React from "react"
import { render } from "@testing-library/react-native"
import { SignUpScreen } from "../../app/screens/SignUpScreen"
import { TestWrapper } from "../utils/TestWrapper"

describe("SignUpScreen", () => {
  it("should render correctly", () => {
    const { getByText } = render(
      <TestWrapper>
        <SignUpScreen />
      </TestWrapper>
    )
    expect(getByText("Sign Up")).toBeTruthy()
  })
})
