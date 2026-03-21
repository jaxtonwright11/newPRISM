import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

interface Props {
  color: string;
  size?: number;
  isLive?: boolean;
  isCommunity?: boolean;
}

export function GlowingPin({ color, size = 10, isLive, isCommunity = true }: Props) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isCommunity) return;

    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const a1 = createPulse(pulse1, 0);
    const a2 = createPulse(pulse2, 600);
    a1.start();
    a2.start();

    return () => {
      a1.stop();
      a2.stop();
    };
  }, [isCommunity, pulse1, pulse2]);

  const pinSize = isCommunity ? size : size * 0.6;

  return (
    <View style={[styles.container, { width: size * 4, height: size * 4 }]}>
      {/* Pulse rings — community pins only */}
      {isCommunity && (
        <>
          <Animated.View
            style={[
              styles.ring,
              {
                width: size * 3,
                height: size * 3,
                borderRadius: size * 1.5,
                borderColor: color,
                opacity: pulse1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 0],
                }),
                transform: [
                  {
                    scale: pulse1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.5],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              {
                width: size * 2.2,
                height: size * 2.2,
                borderRadius: size * 1.1,
                borderColor: color,
                opacity: pulse2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0],
                }),
                transform: [
                  {
                    scale: pulse2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      )}
      {/* Core dot */}
      <View
        style={[
          styles.dot,
          {
            width: pinSize,
            height: pinSize,
            borderRadius: pinSize / 2,
            backgroundColor: color,
            shadowColor: color,
            shadowRadius: isCommunity ? 8 : 4,
          },
        ]}
      />
      {/* LIVE indicator */}
      {isLive && (
        <View style={styles.liveIndicator} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
  },
  dot: {
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  liveIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF3B3B",
  },
});
