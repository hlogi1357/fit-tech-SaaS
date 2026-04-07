import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CapacityMeter } from "../components/capacity-meter";
import { bookSlot, getCapacity, type CapacityResponse } from "../lib/api";

// UI state machine for the booking request lifecycle.
type BookingStatus = "idle" | "loading" | "success" | "error";

// Fixed gym for the technical case study.
const GYM_ID = "gym-1";

// Build default date/time values from the next nearest hour.
// Example output:
// dateInput -> 2026-04-06
// timeInput -> 18:00
const getDefaultSlotParts = (): { dateInput: string; timeInput: string } => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);

  const dateInput = date.toISOString().slice(0, 10);
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const timeInput = `${hours}:${minutes}`;

  return { dateInput, timeInput };
};

// Parse user input into an ISO timestamp expected by the backend.
// We keep this strict so invalid dates/times are caught early in the app.
const buildSlotIso = (dateInput: string, timeInput: string): string | null => {
  const isDateValid = /^\d{4}-\d{2}-\d{2}$/.test(dateInput);
  const isTimeValid = /^\d{2}:\d{2}$/.test(timeInput);

  if (!isDateValid || !isTimeValid) {
    return null;
  }

  const localDateTime = new Date(`${dateInput}T${timeInput}:00`);
  if (Number.isNaN(localDateTime.getTime())) {
    return null;
  }

  return localDateTime.toISOString();
};

export default function IndexScreen() {
  // Capacity screen state.
  const [capacity, setCapacity] = useState<CapacityResponse | null>(null);
  const [isLoadingCapacity, setIsLoadingCapacity] = useState<boolean>(true);
  const [capacityError, setCapacityError] = useState<string | null>(null);

  // Booking state.
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("idle");
  const [bookingMessage, setBookingMessage] = useState<string>("");
  const [userId, setUserId] = useState<string>("member-001");

  // Default slot values are created once, then users can edit them.
  const defaultSlotParts = useMemo(() => getDefaultSlotParts(), []);
  const [slotDate, setSlotDate] = useState<string>(defaultSlotParts.dateInput);
  const [slotTime, setSlotTime] = useState<string>(defaultSlotParts.timeInput);

  // Pull latest capacity from backend.
  const loadCapacity = useCallback(async () => {
    try {
      setIsLoadingCapacity(true);
      setCapacityError(null);
      const response = await getCapacity(GYM_ID);
      setCapacity(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load capacity";
      setCapacityError(message);
    } finally {
      setIsLoadingCapacity(false);
    }
  }, []);

  // Load capacity when the screen mounts.
  useEffect(() => {
    void loadCapacity();
  }, [loadCapacity]);

  // Create a booking for the exact date/time selected by the user.
  const handleBookSlot = useCallback(async () => {
    if (!userId.trim()) {
      Alert.alert("Missing user", "Please enter a user ID.");
      return;
    }

    const slotStart = buildSlotIso(slotDate.trim(), slotTime.trim());
    if (!slotStart) {
      Alert.alert("Invalid slot", "Use date format YYYY-MM-DD and time format HH:mm.");
      return;
    }

    // Guard against booking historical or immediate past slots.
    if (new Date(slotStart).getTime() <= Date.now()) {
      Alert.alert("Invalid slot", "Please choose a future date and time.");
      return;
    }

    try {
      setBookingStatus("loading");
      setBookingMessage("");
      const response = await bookSlot(GYM_ID, {
        userId: userId.trim(),
        slotStart,
      });

      setBookingStatus("success");
      setBookingMessage(`Booked: ${new Date(response.slotStart).toLocaleString()}`);
    } catch (error) {
      setBookingStatus("error");
      const message = error instanceof Error ? error.message : "Booking failed";
      setBookingMessage(message);
    }
  }, [slotDate, slotTime, userId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Fit-Tech Gym Capacity</Text>
        <Text style={styles.subtitle}>Gym ID: {GYM_ID}</Text>

        {isLoadingCapacity ? (
          <View style={styles.centeredBlock}>
            <ActivityIndicator size="large" color="#1e88e5" />
            <Text style={styles.infoText}>Loading live capacity...</Text>
          </View>
        ) : capacityError ? (
          <View style={styles.centeredBlock}>
            <Text style={styles.errorText}>{capacityError}</Text>
            <Pressable style={styles.secondaryButton} onPress={loadCapacity}>
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : capacity ? (
          <CapacityMeter
            capacityPercentage={capacity.capacityPercentage}
            currentOccupancy={capacity.currentOccupancy}
            maxCapacity={capacity.maxCapacity}
          />
        ) : null}

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>User ID</Text>
          <TextInput
            value={userId}
            onChangeText={setUserId}
            style={styles.input}
            autoCapitalize="none"
            placeholder="member-001"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Slot Date (YYYY-MM-DD)</Text>
          <TextInput
            value={slotDate}
            onChangeText={setSlotDate}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            placeholder="2026-04-06"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Slot Time (HH:mm)</Text>
          <TextInput
            value={slotTime}
            onChangeText={setSlotTime}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            placeholder="18:00"
          />
          <Text style={styles.helperText}>Example slot: 2026-04-06 at 18:00</Text>
        </View>

        <Pressable
          style={[styles.primaryButton, bookingStatus === "loading" && styles.buttonDisabled]}
          onPress={handleBookSlot}
          disabled={bookingStatus === "loading"}
        >
          {bookingStatus === "loading" ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Book Slot</Text>
          )}
        </Pressable>

        {bookingStatus === "success" && <Text style={styles.successText}>{bookingMessage}</Text>}
        {bookingStatus === "error" && <Text style={styles.errorText}>{bookingMessage}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fa",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#d9e2ec",
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#102a43",
  },
  subtitle: {
    fontSize: 14,
    color: "#627d98",
  },
  centeredBlock: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#4f5b6b",
  },
  helperText: {
    fontSize: 12,
    color: "#829ab1",
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    color: "#4f5b6b",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd2d9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: "#1e88e5",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#1e88e5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: "#1e88e5",
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  successText: {
    color: "#2d6a4f",
    fontSize: 14,
  },
  errorText: {
    color: "#b42318",
    fontSize: 14,
  },
});
