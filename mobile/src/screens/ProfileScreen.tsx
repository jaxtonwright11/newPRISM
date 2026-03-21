import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, spacing, radius } from "../theme";

export function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>?</Text>
          </View>
        </View>
        <Text style={styles.name}>Sign in to PRISM</Text>
        <Text style={styles.subtitle}>
          Connect with communities and share your perspective.
        </Text>
        <Pressable style={styles.signInBtn}>
          <Text style={styles.signInText}>Sign In</Text>
        </Pressable>
      </View>

      {/* Stats placeholder */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Perspectives Read</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Communities</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    paddingTop: 80,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: {
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bg.secondary,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.text.dim,
    fontSize: 28,
    fontWeight: "300",
  },
  name: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  signInBtn: {
    backgroundColor: colors.accent.active,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  signInText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "monospace",
    marginBottom: 2,
  },
  statLabel: {
    color: colors.text.dim,
    fontSize: 10,
    textAlign: "center",
  },
});
