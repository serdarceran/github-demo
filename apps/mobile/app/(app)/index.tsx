import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createGoalsApi } from "@goal-tracker/api-client";
import { useApiClient, useAuthStore } from "../../stores/authStore";
import type { Goal } from "@goal-tracker/types";
import {
  ScreenContainer,
  GoalCard,
  DangerBanner,
  PrimaryButton,
} from "../../components/ui";
import {
  Colors,
  Typography,
  Spacing,
  Shadows,
  BorderRadius,
} from "../../constants/theme";

export default function GoalsScreen() {
  const client = useApiClient();
  const token = useAuthStore((s) => s.token);
  const { data: goals, isLoading, error } = useQuery<Goal[]>({
    queryKey: ["goals", token],
    queryFn: () => createGoalsApi(client).list(),
    enabled: !!token,
  });

  const dateLabel = new Date()
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();

  const hasPenalty =
    goals?.some((g) => g.status === "active" && g.nextDayMultiplier === 2) ??
    false;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>MY GOALS</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/(app)/calendar")}
            hitSlop={12}
          >
            <Ionicons name="calendar-outline" size={26} color={Colors.neutral[400]} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(app)/goals/create")}
            hitSlop={12}
          >
            <Ionicons name="add-circle-outline" size={28} color={Colors.amber[500]} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.dateText}>{dateLabel}</Text>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.amber[500]} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {(error as Error).message ?? "Failed to load goals"}
          </Text>
        </View>
      );
    }

    if (!goals || goals.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="flag-outline" size={64} color={Colors.amber[500]} />
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptySubtitle}>Launch your first mission</Text>
          <PrimaryButton
            variant="amber"
            label="CREATE GOAL"
            onPress={() => router.push("/(app)/goals/create")}
          />
        </View>
      );
    }

    return (
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <GoalCard
            goal={item}
            index={index}
            onPress={() =>
              router.push({
                pathname: "/(app)/goals/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
        ListHeaderComponent={
          hasPenalty ? (
            <DangerBanner message="PENALTY ACTIVE — Log today to avoid doubling again" />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.root}>
        {renderHeader()}
        {renderContent()}
        <Pressable
          style={styles.fab}
          onPress={() => router.push("/(app)/goals/create")}
        >
          <Ionicons name="add" size={32} color={Colors.bg.base} />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  header: {
    paddingHorizontal: Spacing.screen.horizontal,
    paddingTop: Spacing.screen.vertical,
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  titleText: {
    ...Typography.display.sm,
    color: Colors.neutral.white,
  },
  dateText: {
    ...Typography.body.label,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.screen.horizontal,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    ...Typography.body.md,
    color: Colors.danger[500],
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.display.sm,
    color: Colors.neutral.white,
  },
  emptySubtitle: {
    ...Typography.body.md,
    color: Colors.neutral[500],
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.amber[500],
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.amberGlow,
  },
});
