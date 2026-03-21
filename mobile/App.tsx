import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { TabNavigator } from "./src/navigation/TabNavigator";
import { colors } from "./src/theme";

const prismTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent.active,
    background: colors.bg.primary,
    card: colors.bg.secondary,
    text: colors.text.primary,
    border: colors.border,
    notification: colors.accent.live,
  },
};

export default function App() {
  return (
    <NavigationContainer theme={prismTheme}>
      <StatusBar style="light" />
      <TabNavigator />
    </NavigationContainer>
  );
}
