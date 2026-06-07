import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePreferences } from '../store/preferences';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients, Glass } from '../lib/theme';

export default function SettingsScreen({ navigation }: any) {
  const { avoidSchoolZones, setAvoidSchoolZones } = usePreferences();

  // Mount animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 14, bounciness: 2, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <LinearGradient colors={['#0e1428', '#1a1f38']} style={styles.screen}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.screenTitle}>Preferences</Text>

        {/* Routing section */}
        <Text style={styles.sectionLabel}>ROUTING</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Avoid School Zones</Text>
              <Text style={styles.settingDesc}>
                Routes will detour around school and university areas during peak hours.
              </Text>
            </View>
            <Switch
              value={avoidSchoolZones}
              onValueChange={setAvoidSchoolZones}
              trackColor={{ false: 'rgba(255,255,255,0.12)', true: 'rgba(249,16,102,0.5)' }}
              thumbColor={avoidSchoolZones ? Colors.primary : Colors.mutedText}
              ios_backgroundColor="rgba(255,255,255,0.1)"
            />
          </View>
        </View>

        {/* Reports section */}
        <Text style={styles.sectionLabel}>COMMUNITY</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('ReportSchoolZone')}
          >
            <View style={styles.navRowContent}>
              <Text style={styles.navRowIcon}>🏫</Text>
              <View>
                <Text style={styles.settingTitle}>Report a School Zone</Text>
                <Text style={styles.settingDesc}>Help improve routing data for cyclists</Text>
              </View>
            </View>
            <Text style={styles.navChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About section */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App</Text>
            <Text style={styles.aboutValue}>Pedal Anatolia</Text>
          </View>
          <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.aboutLabel}>Data</Text>
            <Text style={styles.aboutValue}>OpenStreetMap (ODbL)</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  content:  { padding: Spacing.xl, paddingBottom: Spacing.huge },

  screenTitle:  { ...Typography.h1, marginBottom: Spacing.xl },
  sectionLabel: { ...Typography.label, letterSpacing: 1.5, marginBottom: Spacing.sm, marginLeft: Spacing.xs },

  card: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  settingInfo:  { flex: 1 },
  settingTitle: { ...Typography.bodyBold, color: Colors.white, marginBottom: 3 },
  settingDesc:  { ...Typography.caption, lineHeight: 17 },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  navRowContent:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  navRowIcon:   { fontSize: 22 },
  navChevron:   { color: Colors.mutedText, fontSize: 22, fontWeight: '300' },

  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  aboutLabel: { ...Typography.muted },
  aboutValue: { ...Typography.bodyBold, color: Colors.white },
});
