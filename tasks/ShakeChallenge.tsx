import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import { TaskProps } from "./index";

const SHAKE_THRESHOLD = { easy: 1.8, medium: 2.2, hard: 2.8 };
const REQUIRED_SHAKES = { easy: 10, medium: 18, hard: 28 };
const TIME_LIMIT = { easy: 15, medium: 20, hard: 25 };

export default function ShakeChallenge({ difficulty, onComplete }: TaskProps) {
  const [shakeCount, setShakeCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT[difficulty]);
  const required = REQUIRED_SHAKES[difficulty];
  const threshold = SHAKE_THRESHOLD[difficulty];

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lastShake = useRef(0);
  const subscription = useRef<any>(null);

  // Pulse animation on shake
  const doPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    Accelerometer.setUpdateInterval(50); // 20fps

    subscription.current = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (magnitude > threshold && now - lastShake.current > 300) {
        lastShake.current = now;
        doPulse();
        setShakeCount((prev) => {
          const next = prev + 1;
          if (next >= required) {
            onComplete({ success: true });
          }
          return next;
        });
      }
    });

    return () => {
      subscription.current?.remove();
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete({ success: false });
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const progress = shakeCount / required;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📳</Text>
      <Text style={styles.instruction}>Shake your phone!</Text>

      {/* Timer */}
      <View style={styles.timerTrack}>
        <View
          style={[
            styles.timerFill,
            {
              width: `${(timeLeft / TIME_LIMIT[difficulty]) * 100}%`,
              backgroundColor:
                timeLeft / TIME_LIMIT[difficulty] > 0.4
                  ? "#00ff88"
                  : "#ff3b3b",
            },
          ]}
        />
      </View>
      <Text
        style={[
          styles.timerText,
          timeLeft <= 5 && { color: "#ff3b3b", fontWeight: "700" },
        ]}
      >
        {timeLeft}s
      </Text>

      {/* Big shake indicator */}
      <Animated.View
        style={[styles.phoneIcon, { transform: [{ scale: pulseAnim }] }]}
      >
        <Text style={styles.phoneEmoji}>📱</Text>
      </Animated.View>

      {/* Progress ring / bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(progress * 100, 100)}%` },
          ]}
        />
      </View>

      <Text style={styles.countText}>
        <Text style={styles.countNum}>{shakeCount}</Text>
        <Text style={styles.countTotal}> / {required}</Text>
      </Text>
      <Text style={styles.shakeLabel}>shakes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", width: "100%" },
  emoji: { fontSize: 48, marginBottom: 8 },
  instruction: {
    color: "#888",
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 20,
  },
  timerTrack: {
    width: "80%",
    height: 4,
    backgroundColor: "#1a1a2e",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  timerFill: { height: "100%", borderRadius: 2 },
  timerText: { color: "#888", fontSize: 14, marginBottom: 32 },
  phoneIcon: { marginBottom: 32 },
  phoneEmoji: { fontSize: 80 },
  progressTrack: {
    width: "80%",
    height: 8,
    backgroundColor: "#1a1a2e",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7c5cfc",
    borderRadius: 4,
  },
  countText: { textAlign: "center" },
  countNum: { color: "#fff", fontSize: 48, fontWeight: "700" },
  countTotal: { color: "#444", fontSize: 28 },
  shakeLabel: {
    color: "#666",
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
