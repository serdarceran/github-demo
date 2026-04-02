import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { createGoalsApi } from "@goal-tracker/api-client";
import { useApiClient } from "../../stores/authStore";
import type { Goal } from "@goal-tracker/types";

export default function GoalsScreen() {
  const client = useApiClient();
  const { data: goals, isLoading, error } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: () => createGoalsApi(client).list(),
  });

  if (isLoading) return <View style={styles.center}><Text>Loading…</Text></View>;
  if (error) return <View style={styles.center}><Text>Failed to load goals.</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Goals</Text>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.status} · {item.cumulativeTotal} {item.unit}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  card: { padding: 16, borderWidth: 1, borderColor: "#eee", borderRadius: 8, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: "600" },
});
