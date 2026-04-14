import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key) return;

  posthog.init(key, {
    api_host: host ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false, // We track specific events manually
  });
}

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (typeof window === "undefined") return;
  posthog.reset();
}

// Specific PRISM events
export const prismEvents = {
  mapTopicSelected: (topicName: string, communityCount: number) =>
    trackEvent("map_topic_selected", { topic_name: topicName, community_count: communityCount }),

  perspectiveCardViewed: (perspectiveId: string, communityType: string, topic: string) =>
    trackEvent("perspective_card_viewed", { perspective_id: perspectiveId, community_type: communityType, topic }),

  perspectiveCardReaction: (reactionType: string, perspectiveId: string) =>
    trackEvent("perspective_card_reaction", { reaction_type: reactionType, perspective_id: perspectiveId }),

  connectionRequestSent: (fromCommunity: string, toCommunity: string) =>
    trackEvent("connection_request_sent", { from_community: fromCommunity, to_community: toCommunity }),

  postCreated: (postType: string, radius: number, hasImage: boolean) =>
    trackEvent("post_created", { post_type: postType, radius, has_image: hasImage }),

  storyViewed: (communityType: string, topic: string) =>
    trackEvent("story_viewed", { community_type: communityType, topic }),

  discoverFeedOpened: () =>
    trackEvent("discover_feed_opened"),

  onboardingAhaMoment: (topicShown: string, timeToSignupPromptMs: number) =>
    trackEvent("onboarding_aha_moment", { topic_shown: topicShown, time_to_signup_prompt: timeToSignupPromptMs }),

  authSignupCompleted: (source: "organic" | "aha" | "direct") =>
    trackEvent("auth_signup_completed", { source }),

  // Activation funnel events
  activationFirstSessionStart: () =>
    trackEvent("activation_first_session_start"),

  activationComparisonViewed: (topicSlug: string, communityCount: number) =>
    trackEvent("activation_comparison_viewed", { topic_slug: topicSlug, community_count: communityCount }),

  activationComparisonReacted: (topicSlug: string) =>
    trackEvent("activation_comparison_reacted", { topic_slug: topicSlug }),

  activationEventCompleted: () =>
    trackEvent("activation_event_completed", {
      description: "User read perspectives from 2+ communities on same topic",
    }),

  returnDay2: () =>
    trackEvent("return_day_2"),
};
