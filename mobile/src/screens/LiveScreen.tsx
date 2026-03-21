import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
} from "react-native";
import { colors, spacing, radius } from "../theme";
import { PerspectiveCard } from "../components/PerspectiveCard";
import { StoriesBar } from "../components/StoriesBar";
import {
  SEED_TOPICS,
  SEED_PERSPECTIVES,
  SEED_COMMUNITIES,
} from "../lib/seed-data";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = SCREEN_HEIGHT * 0.4;

type FeedTab = "nearby" | "communities" | "discover";

export function LiveScreen() {
  const [activeTab, setActiveTab] = useState<FeedTab>("nearby");
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);

  const currentTopic = SEED_TOPICS[selectedTopicIdx];

  const storyGroups = SEED_COMMUNITIES.map((c) => ({
    id: c.id,
    name: c.name,
    communityType: c.community_type,
    storyCount: 3,
    hasNew: Math.random() > 0.3,
  }));

  const tabs: { id: FeedTab; label: string }[] = [
    { id: "nearby", label: "Nearby" },
    { id: "communities", label: "Communities" },
    { id: "discover", label: "Discover" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoLetter}>P</Text>
          </View>
          <Text style={styles.logoText}>PRISM</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>&#128064;</Text>
          </Pressable>
          <Pressable style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>&#128276;</Text>
          </Pressable>
        </View>
      </View>

      {/* Map placeholder — 40% viewport */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          {/* Pins rendered as colored dots */}
          {SEED_COMMUNITIES.map((c, i) => (
            <View
              key={c.id}
              style={[
                styles.mapPin,
                {
                  backgroundColor: c.color_hex,
                  left: 40 + i * 60,
                  top: 30 + (i % 3) * 50,
                  shadowColor: c.color_hex,
                },
              ]}
            />
          ))}
          {/* Gradient fade at bottom of map */}
          <View style={styles.mapGradient} />
          {/* Topic overlay */}
          <View style={styles.topicOverlay}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>ACTIVE NOW</Text>
            </View>
            <Text style={styles.topicTitle}>{currentTopic.title}</Text>
            <Text style={styles.topicMeta}>
              {currentTopic.community_count} communities &middot;{" "}
              {currentTopic.perspective_count} perspectives
            </Text>
          </View>
        </View>
      </View>

      {/* Stories bar */}
      <StoriesBar stories={storyGroups} />

      {/* Feed tabs */}
      <View style={styles.tabBar}>
        <View style={styles.tabGroup}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.id === "discover" ? "\u2726 " : ""}
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {SEED_PERSPECTIVES.map((p) => (
          <PerspectiveCard
            key={p.id}
            id={p.id}
            quote={p.quote}
            context={p.context}
            communityName={p.community.name}
            communityRegion={p.community.region}
            communityType={p.community.community_type}
            categoryTag={p.category_tag}
            reactionCount={p.reaction_count}
            bookmarkCount={p.bookmark_count}
            verified={p.community.verified}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 20, // safe area
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent.active,
  },
  logoLetter: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  logoText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerBtn: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  headerBtnText: {
    fontSize: 18,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    padding: spacing.sm,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.map.ocean,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    position: "relative",
  },
  mapPin: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  mapGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: colors.bg.primary,
    opacity: 0.7,
  },
  topicOverlay: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.bg.primary + "E6",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.live,
  },
  liveText: {
    color: colors.accent.live,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  topicTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  topicMeta: {
    color: colors.text.dim,
    fontSize: 11,
    fontFamily: "monospace",
  },
  tabBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabGroup: {
    flexDirection: "row",
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.full,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.full,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.accent.active,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#fff",
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
});
