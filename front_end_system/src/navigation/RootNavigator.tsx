import React from "react";
import { useAuth } from "../context/AuthContext";
import AppNavigator from "./AppNavigator";
import AuthNavigator from "./AuthNavigator";

export default function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return null; // Or a Splash screen
  }

  return token ? <AppNavigator /> : <AuthNavigator />;
}
