import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAlarmStore, Alarm } from "../store/alarmStore.ts";
import { Ionicons } from "@expo/vector-icons";

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}

function getNextAlarmText(alarm: Alarm): string {
  if (!alarm.isActive) return "Off";
  const now = new Date();
  const alarmTime = new Date();
  alarmTime.setHours(alarm.hour, alarm.minute, 0, 0);
  if (alarmTime <= now) alarmTime.setDate(alarmTime.getDate() + 1);
  const diff = alarmTime.getTime() - now.getTime();
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs === 0) return `In ${mins}m`;
  return `In ${hrs}h ${mins}m`;
}

const DIFFICULTY_COLOR = {
  easy: "#00ff88",
  medium: "#ffaa00",
  hard: "#ff3b3b",
};

export default function HomeScreen() {
  const router = useRouter();
  const { alarms, toggleAlarm, deleteAlarm, shameFlag, setShameFlag } =
    useAlarmStore();

  // Sort: active first, then by time
  const sorted = [...alarms].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
  });

  const activeCount = alarms.filter((a) => a.isActive).length;

  const handleDelete = (id: string, label: string) => {
    Alert.alert("Delete Alarm", `Delete "${label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteAlarm(id),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* SHAME MODAL */}
      <Modal visible={shameFlag} transparent animationType="fade">
        <View style={styles.shameOverlay}>
          <View style={styles.shameBox}>
            <Text style={styles.shameTitle}>Shame.</Text>
            <Text style={styles.shameBody}>
              You ran away while the alarm was still going.{"\n"}That's not how
              this works.
            </Text>
            <TouchableOpacity
              style={styles.shameBtn}
              onPress={() => setShameFlag(false)}
            >
              <Text style={styles.shameBtnText}>Sorry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Alarms</Text>
          <Text style={styles.headerSub}>
            {activeCount} active
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/alarm/create")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#0a0a0f" />
        </TouchableOpacity>
      </View>

      {/* ALARM LIST */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⏰</Text>
            <Text style={styles.emptyTitle}>No alarms yet</Text>
            <Text style={styles.emptySub}>
              Tap + to create your first alarm
            </Text>
          </View>
        )}

        {sorted.map((alarm) => (
          <TouchableOpacity
            key={alarm.id}
            style={[styles.card, !alarm.isActive && styles.cardInactive]}
            onPress={() => router.push(`/alarm/edit/${alarm.id}`)}
            onLongPress={() => handleDelete(alarm.id, alarm.label)}
            activeOpacity={0.85}
          >
            {/* Time */}
            <View style={styles.cardLeft}>
              <Text
                style={[styles.timeText, !alarm.isActive && styles.textDim]}
              >
                {formatTime(alarm.hour, alarm.minute)}
              </Text>
              <View style={styles.metaRow}>
                {alarm.label ? (
                  <Text style={styles.labelText}>{alarm.label}</Text>
                ) : null}
                <View
                  style={[
                    styles.diffBadge,
                    { borderColor: DIFFICULTY_COLOR[alarm.taskDifficulty] },
                  ]}
                >
                  <Text
                    style={[
                      styles.diffText,
                      { color: DIFFICULTY_COLOR[alarm.taskDifficulty] },
                    ]}
                  >
                    {alarm.taskDifficulty}
                  </Text>
                </View>
              </View>
              <View style={styles.repeatRow}>
                {alarm.repeat.length > 0 ? (
                  alarm.repeat.map((d) => (
                    <Text key={d} style={styles.repeatDay}>
                      {d}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.repeatDay}>Once</Text>
                )}
              </View>
            </View>

            {/* Right side */}
            <View style={styles.cardRight}>
              <Text style={styles.nextText}>{getNextAlarmText(alarm)}</Text>
              <Switch
                value={alarm.isActive}
                onValueChange={() => toggleAlarm(alarm.id)}
                trackColor={{ false: "#2a2a3a", true: "#7c5cfc" }}
                thumbColor={alarm.isActive ? "#fff" : "#666"}
              />
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.hintText}>Long press to delete</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: { color: "#fff", fontSize: 32, fontWeight: "700" },
  headerSub: { color: "#666", fontSize: 14, marginTop: 2 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7c5cfc",
    alignItems: "center",
    justifyContent: "center",
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#12122a",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e1e3a",
  },
  cardInactive: { opacity: 0.45 },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: "flex-end", gap: 8 },
  timeText: { color: "#fff", fontSize: 40, fontWeight: "300", letterSpacing: -1 },
  textDim: { color: "#666" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  labelText: { color: "#aaa", fontSize: 14 },
  diffBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  diffText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  repeatRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  repeatDay: { color: "#555", fontSize: 12, letterSpacing: 0.5 },
  nextText: { color: "#7c5cfc", fontSize: 13, fontWeight: "600" },
  emptyState: { alignItems: "center", marginTop: 120 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { color: "#fff", fontSize: 24, fontWeight: "600" },
  emptySub: { color: "#555", fontSize: 16, marginTop: 8 },
  hintText: { color: "#333", fontSize: 12, textAlign: "center", marginTop: 12 },
  // Shame modal
  shameOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  shameBox: { alignItems: "center" },
  shameTitle: {
    color: "#ff3b3b",
    fontSize: 72,
    fontWeight: "800",
    marginBottom: 24,
  },
  shameBody: {
    color: "#aaa",
    fontSize: 18,
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 48,
  },
  shameBtn: {
    backgroundColor: "#ff3b3b",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  shameBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});