import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
} from "react-native";
import { TaskProps } from "./index";

interface Problem {
  question: string;
  answer: number;
  choices: number[];
}

function generateProblem(difficulty: string): Problem {
  let a: number, b: number, op: string, answer: number, question: string;

  if (difficulty === "easy") {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    op = Math.random() > 0.5 ? "+" : "-";
    answer = op === "+" ? a + b : a - b;
    question = `${a} ${op} ${b}`;
  } else if (difficulty === "medium") {
    a = Math.floor(Math.random() * 12) + 2;
    b = Math.floor(Math.random() * 12) + 2;
    op = Math.random() > 0.5 ? "×" : "+";
    answer = op === "×" ? a * b : a + b + Math.floor(Math.random() * 50);
    question = op === "×" ? `${a} × ${b}` : `${a + 30} + ${b + 20}`;
    if (op !== "×") answer = a + 30 + (b + 20);
  } else {
    // hard
    a = Math.floor(Math.random() * 20) + 5;
    b = Math.floor(Math.random() * 10) + 2;
    const ops = ["×", "²", "√"];
    op = ops[Math.floor(Math.random() * ops.length)];
    if (op === "×") {
      answer = a * b;
      question = `${a} × ${b}`;
    } else if (op === "²") {
      answer = a * a;
      question = `${a}²`;
    } else {
      const base = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144][
        Math.floor(Math.random() * 11)
      ];
      answer = Math.sqrt(base);
      question = `√${base}`;
    }
  }

  // Generate wrong choices near the answer
  const wrongChoices = new Set<number>();
  while (wrongChoices.size < 3) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrong = answer + offset;
    if (wrong !== answer && wrong !== 0) wrongChoices.add(wrong);
  }

  const choices = [answer, ...Array.from(wrongChoices)].sort(
    () => Math.random() - 0.5
  );

  return { question, answer, choices };
}

const TIME_LIMITS = { easy: 15, medium: 20, hard: 25 };

export default function MathChallenge({ difficulty, onComplete }: TaskProps) {
  const [problem, setProblem] = useState(() => generateProblem(difficulty));
  const [timeLeft, setTimeLeft] = useState(TIME_LIMITS[difficulty]);
  const [shakeAnim] = useState(new Animated.Value(0));
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete({ success: false });
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const shake = () => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAnswer = (choice: number) => {
    if (choice === problem.answer) {
      onComplete({ success: true, timeMs: Date.now() - startTime.current });
    } else {
      shake();
      // Regenerate after wrong answer
      setTimeout(() => {
        setProblem(generateProblem(difficulty));
        setTimeLeft(TIME_LIMITS[difficulty]);
        startTime.current = Date.now();
        onComplete({ success: false });
      }, 600);
    }
  };

  const progress = timeLeft / TIME_LIMITS[difficulty];

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🧮</Text>
      <Text style={styles.instruction}>Solve the problem</Text>

      {/* Timer bar */}
      <View style={styles.timerTrack}>
        <Animated.View
          style={[
            styles.timerFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: progress > 0.4 ? "#00ff88" : "#ff3b3b",
            },
          ]}
        />
      </View>
      <Text style={[styles.timerText, timeLeft <= 5 && styles.timerUrgent]}>
        {timeLeft}s
      </Text>

      <Animated.View
        style={[styles.questionBox, { transform: [{ translateX: shakeAnim }] }]}
      >
        <Text style={styles.question}>{problem.question}</Text>
        <Text style={styles.equals}> = ?</Text>
      </Animated.View>

      <View style={styles.choices}>
        {problem.choices.map((choice, i) => (
          <TouchableOpacity
            key={i}
            style={styles.choiceBtn}
            onPress={() => handleAnswer(choice)}
            activeOpacity={0.7}
          >
            <Text style={styles.choiceText}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  timerFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 1s linear",
  },
  timerText: { color: "#888", fontSize: 14, marginBottom: 32 },
  timerUrgent: { color: "#ff3b3b", fontWeight: "700" },
  questionBox: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 40,
  },
  question: { color: "#fff", fontSize: 64, fontWeight: "700" },
  equals: { color: "#888", fontSize: 36 },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    width: "100%",
  },
  choiceBtn: {
    width: "44%",
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: "#12122a",
    borderWidth: 1,
    borderColor: "#2a2a4a",
    alignItems: "center",
  },
  choiceText: { color: "#fff", fontSize: 28, fontWeight: "600" },
});
