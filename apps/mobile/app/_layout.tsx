import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useAuthStore } from "../stores/authStore";
import { useFonts } from "expo-font";
import {
  BebasNeue_400Regular,
} from "@expo-google-fonts/bebas-neue";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
