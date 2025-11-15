import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";

// Import your screens
import LiveCaption from "../screens/LiveCaptions";
import VisionNarrator from "../screens/VisionNarrator";

// Create Tab Navigator
const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          tabBarStyle: { backgroundColor: "#0a0a0a" },
          tabBarActiveTintColor: "#00eaff",
          tabBarInactiveTintColor: "#777",
        }}
      >
        <Tab.Screen
          name="Live Captions"
          component={LiveCaption}
          options={{ title: "Live Captions" }}
        />

        <Tab.Screen
          name="Vision Narrator"
          component={VisionNarrator}
          options={{ title: "Vision" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
