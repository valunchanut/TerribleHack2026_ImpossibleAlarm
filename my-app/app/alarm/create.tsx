import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAlarmStore, RepeatDay } from "../../store/alarmStore";
import { Ionicons } from "@expo/vector-icons";

const DAYS: RepeatDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DIFFICULTIES = [
  { key: "easy", label: "Easy", emoji: "😴", desc: "A few simple problems" },
  { key: "medium", label: "Medium", emoji: "🤔", desc: "Mix of trickier tasks" },
  { key: "hard", label: "Hard", emoji: "😤", desc: "Brutal. You'll be awake." },
] as const;

export default function CreateAlarmScreen() {
  const router = useRouter();
  const { addAlarm } = useAlarmStore();

  const now = new Date();
  const [hour, setHour] = useState(now.getHours());
  const [minute, setMinute] = useState(
    Math.ceil(now.getMinutes() / 5) * 5 % 60
  );
  const [label, setLabel] = useState("");
  const [repeat, setRepeat] = useState<RepeatDay[]>([]);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [taskCount, setTaskCount] = useState(3);

  const toggleDay = (day: RepeatDay) => {
    setRepeat((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const adjustHour = (delta: number) =>
    setHour((h) => (h + delta + 24) % 24);
  const adjustMinute = (delta: number) =>
    setMinute((m) => (m + delta + 60) % 60);

  const formatHour = (h: number) => {
    const display = h % 12 || 12;
    return display.toString();
  };
  const ampm = hour < 12 ? "AM" : "PM";

  const handleSave = () => {
    addAlarm({
      label: label.trim() || "Alarm",
      hour,
      minute,
      repeat,
      isActive: true,
      taskDifficulty: difficulty,
      taskCount,
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#888" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>New Alarm</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* TIME PICKER */}
        <View style={styles.timePicker}>
          {/* Hour */}
          <View style={styles.spinnerCol}>
            <TouchableOpacity onPress={() => adjustHour(1)} style={styles.spinArrow}>
              <Ionicons name="chevron-up" size={24} color="#7c5cfc" />
            </TouchableOpacity>
            <Text style={styles.timeDisplay}>{formatHour(hour)}</Text>
            <TouchableOpacity onPress={() => adjustHour(-1)} style={styles.spinArrow}>
              <Ionicons name="chevron-down" size={24} color="#7c5cfc" />
            </TouchableOpacity>
          </View>

          <Text style={styles.timeSep}>:</Text>

          {/* Minute */}
          <View style={styles.spinnerCol}>
            <TouchableOpacity onPress={() => adjustMinute(5)} style={styles.spinArrow}>
              <Ionicons name="chevron-up" size={24} color="#7c5cfc" />
            </TouchableOpacity>
            <Text style={styles.timeDisplay}>
              {minute.toString().padStart(2, "0")}
            </Text>
            <TouchableOpacity onPress={() => adjustMinute(-5)} style={styles.spinArrow}>
              <Ionicons name="chevron-down" size={24} color="#7c5cfc" />
            </TouchableOpacity>
          </View>

          {/* AM/PM */}
          <TouchableOpacity
            style={styles.ampmBtn}
            onPress={() => setHour((h) => (h + 12) % 24)}
          >
            <Text style={styles.ampmText}>{ampm}</Text>
          </TouchableOpacity>
        </View>

        {/* LABEL */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Label</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Alarm label..."
            placeholderTextColor="#444"
            maxLength={30}
          />
        </View>

        {/* REPEAT DAYS */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Repeat</Text>
          <View style={styles.daysRow}>
            {DAYS.map((day) => {
              const active = repeat.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayBtn, active && styles.dayBtnActive]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>
                    {day[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {repeat.length === 0 && (
            <Text style={styles.onceText}>Rings once</Text>
          )}
        </View>

        {/* DIFFICULTY */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Challenge Difficulty</Text>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[
                styles.diffOption,
                difficulty === d.key && styles.diffOptionActive,
              ]}
              onPress={() => setDifficulty(d.key)}
            >
              <Text style={styles.diffEmoji}>{d.emoji}</Text>
              <View style={styles.diffInfo}>
                <Text style={styles.diffLabel}>{d.label}</Text>
                <Text style={styles.diffDesc}>{d.desc}</Text>
              </View>
              {difficulty === d.key && (
                <Ionicons name="checkmark-circle" size={22} color="#7c5cfc" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* TASK COUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tasks to dismiss</Text>
          <View style={styles.countRow}>
            <TouchableOpacity
              style={styles.countBtn}
              onPress={() => setTaskCount((c) => Math.max(1, c - 1))}
            >
              <Ionicons name="remove" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.countNum}>{taskCount}</Text>
            <TouchableOpacity
              style={styles.countBtn}
              onPress={() => setTaskCount((c) => Math.min(10, c + 1))}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.countHint}>
            +1 extra task added for each wrong answer
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f", paddingTop: 56 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  navTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#7c5cfc",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  // Time picker
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  spinnerCol: { alignItems: "center" },
  spinArrow: { padding: 8 },
  timeDisplay: {
    color: "#fff",
    fontSize: 72,
    fontWeight: "200",
    width: 100,
    textAlign: "center",
  },
  timeSep: {
    color: "#555",
    fontSize: 60,
    fontWeight: "100",
    marginBottom: 8,
  },
  ampmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
    marginLeft: 8,
    marginTop: 8,
  },
  ampmText: { color: "#7c5cfc", fontSize: 20, fontWeight: "700" },
  // Sections
  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionLabel: {
    color: "#666",
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#12122a",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#1e1e3a",
  },
  daysRow: { flexDirection: "row", gap: 8 },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#12122a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1e1e3a",
  },
  dayBtnActive: { backgroundColor: "#7c5cfc", borderColor: "#7c5cfc" },
  dayText: { color: "#555", fontSize: 13, fontWeight: "600" },
  dayTextActive: { color: "#fff" },
  onceText: { color: "#555", fontSize: 13, marginTop: 8 },
  // Difficulty
  diffOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12122a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1e1e3a",
    gap: 12,
  },
  diffOptionActive: { borderColor: "#7c5cfc" },
  diffEmoji: { fontSize: 28 },
  diffInfo: { flex: 1 },
  diffLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  diffDesc: { color: "#666", fontSize: 13, marginTop: 2 },
  // Task count
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  countBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#12122a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1e1e3a",
  },
  countNum: { color: "#fff", fontSize: 36, fontWeight: "300", minWidth: 40, textAlign: "center" },
  countHint: { color: "#444", fontSize: 12, marginTop: 8 },
});
