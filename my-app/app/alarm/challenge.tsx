import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AppState,
  AppStateStatus,
  Vibration,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAlarmStore } from "../../store/alarmStore";
import { getRandomTask, TaskDefinition } from "../../tasks/index";
import { TaskResult } from "../../tasks/index";

export default function ChallengeScreen() {
  const router = useRouter();
  const { alarmId } = useLocalSearchParams<{ alarmId: string }>();
  const { alarms, setShameFlag } = useAlarmStore();
  const alarm = alarms.find((a) => a.id === alarmId) || alarms[0];

  const difficulty = alarm?.taskDifficulty ?? "medium";
  const initialTasks = alarm?.taskCount ?? 3;

  const [totalRequired, setTotalRequired] = useState(initialTasks);
  const [completedCount, setCompletedCount] = useState(0);
  const [currentTask, setCurrentTask] = useState<TaskDefinition>(() =>
    getRandomTask(difficulty)
  );
  const [penalty, setPenalty] = useState(false);
  const [penaltyCount, setPenaltyCount] = useState(0);

  const taskKey = useRef(0); // force remount of task component on change
  const [taskKeyState, setTaskKeyState] = useState(0);

  const penaltyAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(1)).current;

  // ── SHAME FLAG: detect app going to background ─────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "background" || state === "inactive") {
        setShameFlag(true);
      }
    });
    return () => sub.remove();
  }, []);

  // ── VIBRATION: keep buzzing until done ─────────────────────────────────
  useEffect(() => {
    const pattern = [0, 400, 200, 400, 200, 400, 800];
    Vibration.vibrate(pattern, true);
    return () => Vibration.cancel();
  }, []);

  const flashPenalty = () => {
    penaltyAnim.setValue(1);
    Animated.timing(penaltyAnim, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  };

  const handleTaskComplete = useCallback(
    (result: TaskResult) => {
      if (result.success) {
        const newCompleted = completedCount + 1;
        setCompletedCount(newCompleted);

        if (newCompleted >= totalRequired) {
          // 🎉 ALL DONE
          Vibration.cancel();
          router.replace("/");
          return;
        }

        // Pick next task (different from current if possible)
        let next = getRandomTask(difficulty);
        let tries = 0;
        while (next.id === currentTask.id && tries < 5) {
          next = getRandomTask(difficulty);
          tries++;
        }
        setCurrentTask(next);
        taskKey.current++;
        setTaskKeyState(taskKey.current);
      } else {
        // ❌ WRONG — add a penalty task
        setPenaltyCount((c) => c + 1);
        setTotalRequired((t) => t + 1);
        setPenalty(true);
        flashPenalty();
        setTimeout(() => setPenalty(false), 1000);

        // Refresh current task (same type, new question)
        let next = getRandomTask(difficulty);
        setCurrentTask(next);
        taskKey.current++;
        setTaskKeyState(taskKey.current);
      }
    },
    [completedCount, totalRequired, currentTask, difficulty]
  );

  const remaining = totalRequired - completedCount;
  const penaltyBg = penaltyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,59,59,0)", "rgba(255,59,59,0.3)"],
  });

  const TaskComponent = currentTask.component;

  return (
    <Animated.View style={[styles.container, { backgroundColor: penaltyBg }]}>
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTaskName}>
            {currentTask.emoji} {currentTask.name}
          </Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {completedCount}/{totalRequired}
            </Text>
          </View>
        </View>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalRequired }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < completedCount
                  ? styles.dotDone
                  : i === completedCount
                  ? styles.dotCurrent
                  : styles.dotPending,
              ]}
            />
          ))}
        </View>

        {/* Penalty flash message */}
        {penalty && (
          <View style={styles.penaltyBanner}>
            <Text style={styles.penaltyText}>
              ❌ Wrong! +1 task added
            </Text>
          </View>
        )}

        {/* Remaining counter */}
        <Text style={styles.remainingText}>
          {remaining} task{remaining !== 1 ? "s" : ""} remaining
        </Text>
        {penaltyCount > 0 && (
          <Text style={styles.penaltyCount}>
            ({penaltyCount} penalt{penaltyCount !== 1 ? "ies" : "y"} added)
          </Text>
        )}

        {/* THE ACTUAL TASK */}
        <View style={styles.taskWrapper}>
          <TaskComponent
            key={taskKeyState}
            difficulty={difficulty}
            onComplete={handleTaskComplete}
          />
        </View>

        <Text style={styles.noEscape}>Alarm will keep ringing until you're done</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  inner: { flex: 1, paddingTop: 64, paddingHorizontal: 24, alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  headerTaskName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  progressBadge: {
    backgroundColor: "#7c5cfc",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 24,
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotDone: { backgroundColor: "#00ff88" },
  dotCurrent: { backgroundColor: "#7c5cfc" },
  dotPending: { backgroundColor: "#2a2a3a" },
  penaltyBanner: {
    backgroundColor: "rgba(255,59,59,0.2)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ff3b3b",
  },
  penaltyText: { color: "#ff3b3b", fontWeight: "700", fontSize: 16 },
  remainingText: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 4 },
  penaltyCount: { color: "#ff3b3b", fontSize: 13, marginBottom: 16 },
  taskWrapper: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  noEscape: { color: "#333", fontSize: 12, marginBottom: 32, letterSpacing: 0.5 },
});
