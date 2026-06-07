import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteInstruction } from '../lib/api';
import { Colors, Spacing, BorderRadius, Typography, Gradients } from '../lib/theme';

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
      {/* Step circle */}
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepCircle}
      >
        <Text style={styles.stepNumber}>{index + 1}</Text>
      </LinearGradient>

      {/* Connecting line (except last) */}
      {index < instructions.length - 1 && <View style={styles.connector} />}

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
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 260,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  listContent: { paddingVertical: Spacing.sm },

  itemContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
    position: 'relative',
  },

  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
    zIndex: 2,
  },
  stepNumber: { color: Colors.white, fontSize: 11, fontWeight: '800' },

  connector: {
    position: 'absolute',
    left: 12,
    top: 26,
    width: 2,
    height: Spacing.xl + 2,
    backgroundColor: 'rgba(249,16,102,0.25)',
    zIndex: 1,
  },

  textContainer: { flex: 1, paddingTop: 3 },
  instructionText: { ...Typography.body, color: Colors.white, lineHeight: 20 },
  distanceText:    { ...Typography.caption, marginTop: 2 },
});
