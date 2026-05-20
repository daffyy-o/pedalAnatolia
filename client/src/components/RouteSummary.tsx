import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import InstructionList from './InstructionList';
import { RouteInstruction } from '../lib/api';

interface RouteSummaryProps {
  distance: number; // in meters
  time: number; // in milliseconds
  instructions?: RouteInstruction[];
  onSaveRoute?: () => void;
  schoolZonesAvoided?: boolean;
}

export default function RouteSummary({
  distance,
  time,
  instructions,
  onSaveRoute,
  schoolZonesAvoided,
}: RouteSummaryProps) {
  const [showSteps, setShowSteps] = useState(false);

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
      {schoolZonesAvoided !== undefined && (
        <View style={styles.row}>
          <Text style={styles.label}>Routing profile:</Text>
          <Text style={[styles.value, schoolZonesAvoided ? styles.profileActive : styles.profileNormal]}>
            {schoolZonesAvoided ? 'bike_school_zones' : 'bike'}
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        {onSaveRoute && (
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]} 
            onPress={onSaveRoute}
          >
            <Text style={styles.saveButtonText}>⭐ Save Route</Text>
          </TouchableOpacity>
        )}
        
        {instructions && instructions.length > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.stepsButton]} 
            onPress={() => setShowSteps(!showSteps)}
          >
            <Text style={styles.buttonText}>
              {showSteps ? 'Hide Steps' : 'Show Steps'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {showSteps && instructions && <InstructionList instructions={instructions} />}
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
  },
  profileActive: {
    color: '#c62828',
  },
  profileNormal: {
    color: '#2e7d32',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#ffeb3b',
    marginRight: 5,
  },
  stepsButton: {
    backgroundColor: '#f0f0f0',
    marginLeft: 5,
  },
  saveButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});
