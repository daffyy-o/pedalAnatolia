import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RoutePreviewMap from '../components/RoutePreviewMap';
import {
  publishedRouteToSnapshot,
  useRouteBoard,
} from '../store/routeBoard';
import { useAuth } from '../store/auth';
import { formatDistance, formatDuration } from '../types/routes';

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

  useEffect(() => {
    if (routeId) void loadRouteDetail(routeId, currentUserId);
    return clearSelectedRoute;
  }, [clearSelectedRoute, currentUserId, loadRouteDetail, routeId]);

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e7d32" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  const canDelete = selectedRoute.ownerId === currentUserId || currentUser?.role === 'admin';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{selectedRoute.title}</Text>
      <Text style={styles.publisher}>By {selectedRoute.ownerName}</Text>
      <Text style={styles.routeLine}>{selectedRoute.originName} -> {selectedRoute.destinationName}</Text>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>{formatDistance(selectedRoute.route.distance)}</Text>
        <Text style={styles.stat}>{formatDuration(selectedRoute.route.time)}</Text>
        <Text style={styles.stat}>★ {selectedRoute.ratingAverage.toFixed(1)} ({selectedRoute.ratingCount})</Text>
        <Text style={styles.stat}>{selectedRoute.rideCount} rides</Text>
      </View>
      {selectedRoute.description ? <Text style={styles.description}>{selectedRoute.description}</Text> : null}

      <RoutePreviewMap route={selectedRoute.route} />

      <View style={styles.actions}>
        <Button
          title="Ride this route"
          onPress={() => navigation.navigate('Map', { loadRoute: publishedRouteToSnapshot(selectedRoute) })}
        />
        {canDelete ? <Button title="Delete from board" color="#c62828" onPress={handleDelete} /> : null}
      </View>

      <View style={styles.ratingPanel}>
        <Text style={styles.sectionTitle}>Your rating</Text>
        {canRateSelectedRoute ? (
          <View style={styles.ratingButtons}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[styles.ratingButton, myRating === rating && styles.activeRating]}
                disabled={ratingLoading}
                onPress={() => void handleRate(rating)}
              >
                <Text style={[styles.ratingText, myRating === rating && styles.activeRatingText]}>{rating}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : selectedRoute.ownerId === currentUserId ? (
          <Text style={styles.muted}>You cannot rate your own route.</Text>
        ) : (
          <Text style={styles.muted}>Complete this route before rating it.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7f8' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  error: { color: '#c62828', marginTop: 12, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: '#222' },
  publisher: { color: '#666', marginTop: 4 },
  routeLine: { color: '#333', marginTop: 10, fontWeight: '600' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  stat: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, color: '#2e7d32', fontWeight: '700' },
  description: { marginTop: 14, color: '#444', lineHeight: 20 },
  actions: { gap: 10, marginTop: 14 },
  ratingPanel: { marginTop: 18, backgroundColor: '#fff', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#e0e0e0' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  ratingButtons: { flexDirection: 'row', gap: 8 },
  ratingButton: { width: 42, height: 42, borderRadius: 6, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  activeRating: { backgroundColor: '#2e7d32' },
  ratingText: { fontWeight: '800', color: '#333' },
  activeRatingText: { color: '#fff' },
  muted: { color: '#666' },
});
