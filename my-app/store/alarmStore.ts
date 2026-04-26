import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type RepeatDay =
  | "Mon"
  | "Tue"
  | "Wed"
  | "Thu"
  | "Fri"
  | "Sat"
  | "Sun";

export interface Alarm {
  id: string;
  label: string;
  hour: number;
  minute: number;
  repeat: RepeatDay[];
  isActive: boolean;
  taskDifficulty: "easy" | "medium" | "hard";
  taskCount: number; // how many tasks required to dismiss
  createdAt: number;
}

interface AlarmStore {
  alarms: Alarm[];
  shameFlag: boolean; // true if user closed app during challenge
  addAlarm: (alarm: Omit<Alarm, "id" | "createdAt">) => void;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  setShameFlag: (value: boolean) => void;
}

export const useAlarmStore = create<AlarmStore>()(
  persist(
    (set) => ({
      alarms: [],
      shameFlag: false,

      addAlarm: (alarmData) =>
        set((state) => ({
          alarms: [
            ...state.alarms,
            {
              ...alarmData,
              id: Date.now().toString(),
              createdAt: Date.now(),
            },
          ],
        })),

      updateAlarm: (id, updates) =>
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      deleteAlarm: (id) =>
        set((state) => ({
          alarms: state.alarms.filter((a) => a.id !== id),
        })),

      toggleAlarm: (id) =>
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id ? { ...a, isActive: !a.isActive } : a
          ),
        })),

      setShameFlag: (value) => set({ shameFlag: value }),
    }),
    {
      name: "wakeupp-alarms",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
