import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, communityColor, spacing, radius } from "../theme";
import type { CommunityType } from "../theme";

interface Props {
  id: string;
  quote: string;
  context: string;
  communityName: string;
  communityRegion: string;
  communityType: CommunityType;
  categoryTag?: string;
  reactionCount: number;
  bookmarkCount: number;
  verified?: boolean;
  onPress?: (id: string) => void;
}

export function PerspectiveCard({
  id,
  quote,
  context,
  communityName,
  communityRegion,
  communityType,
  categoryTag,
  reactionCount,
  bookmarkCount,
  verified,
  onPress,
}: Props) {
  const borderColor = communityColor(communityType);

  return (
    <Pressable
      onPress={() => onPress?.(id)}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: borderColor, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      {/* Community header */}
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: borderColor }]} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.communityName}>{communityName}</Text>
            {verified && <Text style={styles.verifiedBadge}>&#10003;</Text>}
          </View>
          <Text style={styles.region}>{communityRegion}</Text>
        </View>
        {categoryTag && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{categoryTag}</Text>
          </View>
        )}
      </View>

      {/* Quote — Playfair Display Italic feel */}
      <Text style={styles.quote}>&ldquo;{quote}&rdquo;</Text>

      {/* Context */}
      <Text style={styles.context} numberOfLines={2}>
        {context}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.reactions}>
          <Text style={styles.reactionText}>
            &#128065; {reactionCount}
          </Text>
          <Text style={styles.reactionText}>
            &#128278; {bookmarkCount}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    borderLeftWidth: 3,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  communityName: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  verifiedBadge: {
    color: colors.accent.verified,
    fontSize: 12,
  },
  region: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  tag: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    color: colors.text.dim,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quote: {
    color: colors.text.primary,
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  context: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reactions: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  reactionText: {
    color: colors.text.dim,
    fontSize: 12,
  },
});
