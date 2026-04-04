import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { useAuthStore } from "../../stores/authStore";

export default function AppLayout() {
  const { token, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace("/(auth)/login");
    }
  }, [token, isHydrated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="goals/log" options={{ presentation: "modal" }} />
    </Stack>
  );
}
