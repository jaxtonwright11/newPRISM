import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from "react-native";
import { colors, spacing, radius } from "../theme";
import { SEED_TOPICS, SEED_COMMUNITIES } from "../lib/seed-data";

export function SearchScreen() {
  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search topics, communities..."
          placeholderTextColor={colors.text.dim}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Trending topics */}
        <Text style={styles.sectionTitle}>Trending Topics</Text>
        {SEED_TOPICS.map((topic) => (
          <Pressable key={topic.id} style={styles.topicRow}>
            <View style={styles.topicInfo}>
              <Text style={styles.topicTitle}>{topic.title}</Text>
              <Text style={styles.topicMeta}>
                {topic.community_count} communities &middot;{" "}
                {topic.perspective_count} perspectives
              </Text>
            </View>
            {topic.status === "hot" && (
              <View style={styles.hotBadge}>
                <View style={styles.hotDot} />
                <Text style={styles.hotText}>HOT</Text>
              </View>
            )}
          </Pressable>
        ))}

        {/* Communities */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
          Communities
        </Text>
        {SEED_COMMUNITIES.map((c) => (
          <Pressable key={c.id} style={styles.communityRow}>
            <View style={[styles.communityDot, { backgroundColor: c.color_hex }]} />
            <View style={styles.communityInfo}>
              <Text style={styles.communityName}>{c.name}</Text>
              <Text style={styles.communityRegion}>{c.region}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    paddingTop: 60,
  },
  searchBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text.primary,
    fontSize: 15,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  topicMeta: {
    color: colors.text.dim,
    fontSize: 12,
    fontFamily: "monospace",
  },
  hotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accent.live + "15",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  hotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.live,
  },
  hotText: {
    color: colors.accent.live,
    fontSize: 10,
    fontWeight: "700",
  },
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  communityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  communityRegion: {
    color: colors.text.secondary,
    fontSize: 12,
  },
});
