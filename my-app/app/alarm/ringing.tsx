import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAlarmStore } from "../../store/alarmStore";
import { Audio } from "expo-av";

function formatTime(hour: number, minute: number) {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return { time: `${h}:${m}`, ampm };
}

export default function RingingScreen() {
  const router = useRouter();
  const { alarmId } = useLocalSearchParams<{ alarmId: string }>();
  const { alarms } = useAlarmStore();
  const alarm = alarms.find((a) => a.id === alarmId) || alarms[0];

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    ).start();

    // Vibration pattern: buzz, pause, buzz, pause...
    const VIBRATION_PATTERN = [0, 500, 300, 500, 300, 500, 1000];
    Vibration.vibrate(VIBRATION_PATTERN, true);

    return () => {
      Vibration.cancel();
    };
  }, []);

  const handleStartChallenge = () => {
    Vibration.cancel();
    router.replace({
      pathname: "/alarm/challenge",
      params: { alarmId: alarm?.id },
    });
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,59,59,0.1)", "rgba(255,59,59,0.35)"],
  });

  const { time, ampm } = alarm
    ? formatTime(alarm.hour, alarm.minute)
    : { time: "--:--", ampm: "" };

  const now = new Date();

  return (
    <Animated.View style={[styles.container, { backgroundColor: glowColor }]}>
      <View style={styles.inner}>
        {/* Label */}
        {alarm?.label && (
          <Text style={styles.alarmLabel}>{alarm.label}</Text>
        )}

        {/* Clock display */}
        <Animated.View style={[styles.clockWrap, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.timeText}>{time}</Text>
          <Text style={styles.ampmText}>{ampm}</Text>
        </Animated.View>

        {/* Current real time */}
        <Text style={styles.realDate}>
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>

        {/* Alarm emoji */}
        <Text style={styles.bellEmoji}>🔔</Text>

        {/* Task preview */}
        {alarm && (
          <View style={styles.taskPreview}>
            <Text style={styles.taskPreviewText}>
              {alarm.taskCount} challenge{alarm.taskCount !== 1 ? "s" : ""} await you
            </Text>
            <Text style={styles.taskPreviewDiff}>
              Difficulty: {alarm.taskDifficulty}
            </Text>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={handleStartChallenge}
          activeOpacity={0.85}
        >
          <Text style={styles.dismissBtnText}>Start Challenges</Text>
          <Text style={styles.dismissBtnSub}>to turn off alarm</Text>
        </TouchableOpacity>

        <Text style={styles.noSnooze}>No snooze. No mercy.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  inner: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  alarmLabel: { color: "#888", fontSize: 18, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 },
  clockWrap: { alignItems: "center" },
  timeText: { color: "#fff", fontSize: 96, fontWeight: "100", letterSpacing: -4 },
  ampmText: { color: "#ff3b3b", fontSize: 28, fontWeight: "700", letterSpacing: 2, marginTop: -8 },
  realDate: { color: "#555", fontSize: 16, marginTop: 8, marginBottom: 32 },
  bellEmoji: { fontSize: 80, marginBottom: 32 },
  taskPreview: {
    backgroundColor: "#12122a",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 48,
    borderWidth: 1,
    borderColor: "#1e1e3a",
  },
  taskPreviewText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  taskPreviewDiff: { color: "#7c5cfc", fontSize: 14, marginTop: 4 },
  dismissBtn: {
    backgroundColor: "#ff3b3b",
    paddingHorizontal: 48,
    paddingVertical: 22,
    borderRadius: 24,
    alignItems: "center",
    width: "100%",
  },
  dismissBtnText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  dismissBtnSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 },
  noSnooze: { color: "#333", fontSize: 13, marginTop: 24, letterSpacing: 1 },
});
