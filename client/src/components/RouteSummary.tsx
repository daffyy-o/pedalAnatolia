import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RouteSummaryProps {
  distance: number; // in meters
  time: number; // in milliseconds
}

export default function RouteSummary({ distance, time }: RouteSummaryProps) {
  const formatDistance = (m: number) => {
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(2)} km`;
  };

  const formatTime = (ms: number) => {
    const minutes = Math.ceil(ms / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} h ${mins} min`;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Route Summary</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Distance:</Text>
        <Text style={styles.value}>{formatDistance(distance)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Estimated Time:</Text>
        <Text style={styles.value}>{formatTime(time)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    marginVertical: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  label: {
    color: '#555',
  },
  value: {
    fontWeight: '500',
  }
});
