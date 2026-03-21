import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../theme";

export function MapScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.title}>Full Map</Text>
        <Text style={styles.subtitle}>
          Mapbox GL will render here with community pins, heat overlays, and
          topic-filtered views.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.map.ocean,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
