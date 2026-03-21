import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { colors, communityColor, spacing, radius } from "../theme";
import type { CommunityType } from "../theme";

interface StoryGroup {
  id: string;
  name: string;
  communityType: CommunityType;
  storyCount: number;
  hasNew: boolean;
}

interface Props {
  stories: StoryGroup[];
  onPress?: (id: string) => void;
}

export function StoriesBar({ stories, onPress }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      snapToInterval={76}
      decelerationRate="fast"
    >
      {stories.map((story) => {
        const color = communityColor(story.communityType);
        return (
          <Pressable
            key={story.id}
            onPress={() => onPress?.(story.id)}
            style={styles.storyItem}
          >
            <View style={[styles.ring, { borderColor: story.hasNew ? color : colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: color + "20" }]}>
                <Text style={[styles.initial, { color }]}>
                  {story.name.charAt(0)}
                </Text>
              </View>
              {story.hasNew && (
                <View style={styles.liveDot} />
              )}
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {story.name.split(" ")[0]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  storyItem: {
    alignItems: "center",
    width: 64,
  },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontSize: 18,
    fontWeight: "700",
  },
  liveDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.live,
    borderWidth: 2,
    borderColor: colors.bg.primary,
  },
  name: {
    color: colors.text.secondary,
    fontSize: 11,
    textAlign: "center",
  },
});
