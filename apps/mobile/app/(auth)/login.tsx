import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { InputField } from "../../components/ui";
import { PrimaryButton } from "../../components/ui";
import { DangerBanner } from "../../components/ui";
import { ScreenContainer } from "../../components/ui";
import { Colors, Typography, Spacing } from "../../constants/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuthStore();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 300, delay: 200, useNativeDriver: true }),
      Animated.timing(formOpacity, { toValue: 1, duration: 300, delay: 400, useNativeDriver: true }),
      Animated.timing(formTranslateY, { toValue: 0, duration: 300, delay: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleLogin() {
    setError(null);
    try {
      await login(email, password);
      router.replace("/(app)");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(msg);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.outer}>
        <Animated.View style={[styles.logoSection, { opacity: logoOpacity }]}>
          <Text style={styles.galactic}>GALACTIC</Text>
          <Text style={styles.scoreboard}>SCOREBOARD</Text>
          <Text style={styles.subtitle}>Your goals. Your debt. Your streak.</Text>
        </Animated.View>

        <View style={styles.divider} />

        <Animated.View style={[styles.formSection, { opacity: formOpacity, transform: [{ translateY: formTranslateY }] }]}>
          {error && <DangerBanner message={error} />}
          <InputField
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <PrimaryButton
            variant="amber"
            label={isLoading ? "ENTERING..." : "ENTER THE SCOREBOARD"}
            fullWidth
            onPress={handleLogin}
            disabled={isLoading}
          />
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.screen.horizontal,
  },
  logoSection: {
    alignItems: "center",
  },
  galactic: {
    ...Typography.display.lg,
    color: Colors.amber[500],
    textAlign: "center",
  },
  scoreboard: {
    ...Typography.display.md,
    color: Colors.neutral.white,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body.md,
    color: Colors.neutral[500],
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.amber[500] + "33",
    marginVertical: Spacing.xl,
  },
  formSection: {
    gap: Spacing.md,
  },
});
