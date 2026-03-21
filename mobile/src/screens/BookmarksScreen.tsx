import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

export function BookmarksScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No bookmarks yet</Text>
        <Text style={styles.emptyBody}>
          Save perspectives that shift your understanding. They&apos;ll appear here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    paddingTop: 60,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  emptyBody: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
