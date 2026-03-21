import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";
import { LiveScreen } from "../screens/LiveScreen";
import { MapScreen } from "../screens/MapScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { BookmarksScreen } from "../screens/BookmarksScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Live: "\u25CF", // filled dot
    Map: "\u25A1", // square
    Search: "\u2315", // search
    Bookmarks: "\u2606", // star
    Profile: "\u2299", // circled dot
  };

  return (
    <View style={styles.iconContainer}>
      <Text
        style={[
          styles.icon,
          { color: focused ? colors.accent.active : colors.text.dim },
        ]}
      >
        {icons[name] ?? "?"}
      </Text>
      {name === "Live" && (
        <View style={styles.liveDot} />
      )}
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent.active,
        tabBarInactiveTintColor: colors.text.dim,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Live" component={LiveScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg.secondary,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
    paddingBottom: 24,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
  },
  icon: {
    fontSize: 18,
  },
  liveDot: {
    position: "absolute",
    top: -2,
    right: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.live,
  },
});
