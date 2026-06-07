import React, { useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import InstructionList from './InstructionList';
import { RouteInstruction } from '../lib/api';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients, Glass } from '../lib/theme';

interface RouteSummaryProps {
  distance: number; // in meters
  time: number;     // in milliseconds
  instructions?: RouteInstruction[];
  onSaveRoute?: () => void;
  onRouteDone?: () => void;
  routeDone?: boolean;
  schoolZonesAvoided?: boolean;
}

function ActionButton({
  label,
  onPress,
  disabled,
  variant,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant: 'save' | 'done' | 'done-disabled' | 'steps';
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={{ flex: 1 }}
    >
      <Animated.View style={[{ transform: [{ scale }] }, disabled && { opacity: 0.55 }]}>
        {variant === 'done' ? (
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>{label}</Text>
          </LinearGradient>
        ) : variant === 'save' ? (
          <View style={[styles.actionButton, styles.saveButton]}>
            <Text style={styles.saveButtonText}>{label}</Text>
          </View>
        ) : variant === 'done-disabled' ? (
          <View style={[styles.actionButton, styles.doneDisabledButton]}>
            <Text style={styles.actionButtonText}>{label}</Text>
          </View>
        ) : (
          <View style={[styles.actionButton, styles.stepsButton]}>
            <Text style={styles.stepsButtonText}>{label}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function RouteSummary({
  distance,
  time,
  instructions,
  onSaveRoute,
  onRouteDone,
  routeDone,
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
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Route Summary</Text>
        {schoolZonesAvoided !== undefined && (
          <View style={[styles.profileBadge, schoolZonesAvoided ? styles.profileBadgeActive : styles.profileBadgeMuted]}>
            <Text style={styles.profileBadgeText}>
              {schoolZonesAvoided ? '🏫 School-safe' : '🚴 Standard'}
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📏</Text>
          <Text style={styles.statValue}>{formatDistance(distance)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statValue}>{formatTime(time)}</Text>
          <Text style={styles.statLabel}>Est. Time</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        {onSaveRoute && (
          <ActionButton label="⭐ Save" onPress={onSaveRoute} variant="save" />
        )}
        {onRouteDone && (
          <ActionButton
            label={routeDone ? '✓ Done!' : '🏁 Route Done'}
            onPress={onRouteDone}
            disabled={routeDone}
            variant={routeDone ? 'done-disabled' : 'done'}
          />
        )}
        {instructions && instructions.length > 0 && (
          <ActionButton
            label={showSteps ? 'Hide Steps' : 'Steps'}
            onPress={() => setShowSteps(!showSteps)}
            variant="steps"
          />
        )}
      </View>

      {showSteps && instructions && <InstructionList instructions={instructions} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.lg,
  },

  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle:      { ...Typography.h4 },

  profileBadge:       { borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  profileBadgeActive: { backgroundColor: 'rgba(249,16,102,0.2)', borderWidth: 1, borderColor: 'rgba(249,16,102,0.4)' },
  profileBadgeMuted:  { backgroundColor: 'rgba(139,143,163,0.15)', borderWidth: 1, borderColor: 'rgba(139,143,163,0.25)' },
  profileBadgeText:   { fontSize: 11, fontWeight: '600', color: Colors.white },

  statsRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  statItem:    { flex: 1, alignItems: 'center' },
  statIcon:    { fontSize: 18, marginBottom: Spacing.xs },
  statValue:   { ...Typography.h3, fontSize: 20, color: Colors.white },
  statLabel:   { ...Typography.label, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.08)' },

  buttonRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },

  actionButton: {
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText:    { color: Colors.white, fontWeight: '700', fontSize: 13 },
  saveButton:          { backgroundColor: 'rgba(255,133,82,0.25)', borderWidth: 1, borderColor: 'rgba(255,133,82,0.4)' },
  saveButtonText:      { color: Colors.accent, fontWeight: '700', fontSize: 13 },
  doneDisabledButton:  { backgroundColor: 'rgba(139,143,163,0.2)', borderWidth: 1, borderColor: 'rgba(139,143,163,0.25)' },
  stepsButton:         { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  stepsButtonText:     { color: Colors.mutedText, fontWeight: '600', fontSize: 13 },
});
