import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

// Reusable presentation component with no API/state side effects.
type CapacityMeterProps = {
  capacityPercentage: number;
  currentOccupancy: number;
  maxCapacity: number;
};

// Keep the meter value inside the visual range.
const clamp = (value: number): number => Math.max(0, Math.min(100, value));

function CapacityMeterComponent({
  capacityPercentage,
  currentOccupancy,
  maxCapacity,
}: CapacityMeterProps) {
  const normalized = clamp(capacityPercentage);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Live Capacity</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${normalized}%` }]} />
      </View>
      <Text style={styles.value}>{normalized}%</Text>
      <Text style={styles.subValue}>
        {currentOccupancy} / {maxCapacity} people
      </Text>
    </View>
  );
}

export const CapacityMeter = memo(CapacityMeterComponent);

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  label: {
    fontSize: 14,
    color: "#4f5b6b",
    marginBottom: 8,
  },
  track: {
    width: "100%",
    height: 14,
    borderRadius: 999,
    backgroundColor: "#eaf0f7",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#1e88e5",
  },
  value: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: "700",
    color: "#102a43",
  },
  subValue: {
    marginTop: 2,
    fontSize: 13,
    color: "#627d98",
  },
});
