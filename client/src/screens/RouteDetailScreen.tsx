import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { Alert } from '../components/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';
import RoutePreviewMap from '../components/RoutePreviewMap';
import { publishedRouteToSnapshot, useRouteBoard } from '../store/routeBoard';
import { useAuth } from '../store/auth';
import { formatDistance, formatDuration } from '../types/routes';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients, Glass } from '../lib/theme';

function StarButton({
  rating,
  selected,
  disabled,
  onPress,
}: {
  rating: number;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, speed: 50, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 50, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View style={[styles.starBtn, selected && styles.starBtnActive, { transform: [{ scale }] }]}>
        <Text style={[styles.starText, selected && styles.starTextActive]}>★ {rating}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function RouteDetailScreen({ route: navRoute, navigation }: any) {
  const routeId = navRoute?.params?.routeId;
  const { users, currentUserId } = useAuth();
  const currentUser = users.find((user) => user.id === currentUserId);
  const {
    selectedRoute,
    detailLoading,
    ratingLoading,
    error,
    myRating,
    canRateSelectedRoute,
    loadRouteDetail,
    rateRoute,
    deleteRoute,
    clearSelectedRoute,
  } = useRouteBoard();

  // Mount animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const rideScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (routeId) void loadRouteDetail(routeId, currentUserId);
    return clearSelectedRoute;
  }, [clearSelectedRoute, currentUserId, loadRouteDetail, routeId]);

  useEffect(() => {
    if (!detailLoading && selectedRoute) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, speed: 12, bounciness: 3, useNativeDriver: true }),
      ]).start();
    }
  }, [detailLoading, selectedRoute, fadeAnim, slideAnim]);

  const handleRate = async (rating: number) => {
    if (!routeId) return;
    try {
      await rateRoute(routeId, rating);
      await loadRouteDetail(routeId, currentUserId);
    } catch (rateError) {
      Alert.alert('Could not rate route', rateError instanceof Error ? rateError.message : 'Please complete the route first.');
    }
  };

  const handleDelete = () => {
    if (!selectedRoute) return;
    Alert.alert('Delete shared route', `Remove "${selectedRoute.title}" from the Route Board?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRoute(selectedRoute.id);
            navigation.navigate('RouteBoard');
          } catch (deleteError) {
            Alert.alert('Could not delete route', deleteError instanceof Error ? deleteError.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  if (detailLoading || !selectedRoute) {
    return (
      <LinearGradient colors={['#0e1428', '#1a1f38']} style={styles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </LinearGradient>
    );
  }

  const canDelete = selectedRoute.ownerId === currentUserId || currentUser?.role === 'admin';

  return (
    <LinearGradient colors={['#0e1428', '#1a1f38']} style={styles.screen}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <Text style={styles.title}>{selectedRoute.title}</Text>
        <Text style={styles.publisher}>by {selectedRoute.ownerName}</Text>
        <Text style={styles.routeLine}>
          {selectedRoute.originName} → {selectedRoute.destinationName}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillIcon}>📏</Text>
            <Text style={styles.statPillValue}>{formatDistance(selectedRoute.route.distance)}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillIcon}>⏱️</Text>
            <Text style={styles.statPillValue}>{formatDuration(selectedRoute.route.time)}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillIcon}>★</Text>
            <Text style={styles.statPillValue}>
              {selectedRoute.ratingAverage.toFixed(1)} ({selectedRoute.ratingCount})
            </Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillIcon}>🚴</Text>
            <Text style={styles.statPillValue}>{selectedRoute.rideCount} rides</Text>
          </View>
        </View>

        {selectedRoute.description ? (
          <Text style={styles.description}>{selectedRoute.description}</Text>
        ) : null}

        {/* Map preview */}
        <RoutePreviewMap route={selectedRoute.route} />

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Map', { loadRoute: publishedRouteToSnapshot(selectedRoute) })}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.rideButton}
            >
              <Text style={styles.rideButtonText}>🚴 Ride This Route</Text>
            </LinearGradient>
          </TouchableOpacity>

          {canDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete from Board</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Rating panel */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>Your Rating</Text>
          {canRateSelectedRoute ? (
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <StarButton
                  key={rating}
                  rating={rating}
                  selected={myRating === rating}
                  disabled={ratingLoading}
                  onPress={() => void handleRate(rating)}
                />
              ))}
            </View>
          ) : selectedRoute.ownerId === currentUserId ? (
            <Text style={styles.ratingMuted}>You cannot rate your own route.</Text>
          ) : (
            <Text style={styles.ratingMuted}>Complete this route before rating it.</Text>
          )}
        </View>
      </Animated.ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  content:  { padding: Spacing.xl, paddingBottom: Spacing.huge },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText:{ ...Typography.body, color: Colors.error, marginTop: Spacing.md },

  title:     { ...Typography.h1, marginBottom: Spacing.xs },
  publisher: { ...Typography.muted, marginBottom: Spacing.sm },
  routeLine: { ...Typography.bodyBold, color: Colors.surface, marginBottom: Spacing.lg },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  statPill: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  statPillIcon:  { fontSize: 14 },
  statPillValue: { ...Typography.bodyBold, color: Colors.primary },

  description: { ...Typography.body, lineHeight: 22, marginBottom: Spacing.lg, color: Colors.surface },

  actions:    { gap: Spacing.sm, marginTop: Spacing.xl },
  rideButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    ...Shadows.glow,
  },
  rideButtonText: { color: Colors.white, fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },

  deleteButton: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  deleteButtonText: { color: Colors.error, fontWeight: '700' },

  ratingCard: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
  },
  ratingTitle: { ...Typography.h4, marginBottom: Spacing.md },
  starRow:     { flexDirection: 'row', gap: Spacing.sm },
  starBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBtnActive:    { backgroundColor: 'rgba(255,133,82,0.25)', borderColor: 'rgba(255,133,82,0.5)' },
  starText:         { fontWeight: '700', color: Colors.mutedText, fontSize: 13 },
  starTextActive:   { color: Colors.accent },
  ratingMuted:      { ...Typography.muted },
});
