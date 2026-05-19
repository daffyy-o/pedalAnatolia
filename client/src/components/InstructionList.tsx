import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { RouteInstruction } from '../lib/api';

interface InstructionListProps {
  instructions: RouteInstruction[];
}

export default function InstructionList({ instructions }: InstructionListProps) {
  const formatDistance = (m: number) => {
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(2)} km`;
  };

  const renderItem = ({ item, index }: { item: RouteInstruction; index: number }) => (
    <View style={styles.itemContainer}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNumber}>{index + 1}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.instructionText}>{item.text}</Text>
        <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={instructions}
      keyExtractor={(_, index) => index.toString()}
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 250,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  listContent: {
    paddingVertical: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
  },
  distanceText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
