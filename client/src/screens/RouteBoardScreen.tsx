import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteBoardSort, useRouteBoard, PublishedRoute } from '../store/routeBoard';
import { formatDistance, formatDuration } from '../types/routes';

const SORTS: Array<{ label: string; value: RouteBoardSort }> = [
  { label: 'Newest', value: 'newest' },
  { label: 'Rating', value: 'rating' },
  { label: 'Most ridden', value: 'rides' },
  { label: 'Shortest', value: 'shortest' },
  { label: 'Longest', value: 'longest' },
];

export default function RouteBoardScreen({ navigation }: any) {
  const { routes, filters, loading, error, hasMore, setFilters, loadRoutes } = useRouteBoard();

  useEffect(() => {
    void loadRoutes(true);
  }, [filters, loadRoutes]);

  const renderRoute = ({ item }: { item: PublishedRoute }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.rating}>★ {item.ratingAverage.toFixed(1)} ({item.ratingCount})</Text>
      </View>
      <Text style={styles.routeLine}>{item.originName} -> {item.destinationName}</Text>
      <Text style={styles.meta}>
        {formatDistance(item.route.distance)} • {formatDuration(item.route.time)} • {item.rideCount} rides
      </Text>
      <Text style={styles.publisher}>By {item.ownerName}</Text>
      {item.description ? <Text style={styles.description} numberOfLines={2}>{item.description}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder="Search routes"
          value={filters.search}
          onChangeText={(search) => setFilters({ search })}
        />
        <View style={styles.filterRow}>
          <TextInput
            style={[styles.input, styles.smallInput]}
            placeholder="Min km"
            keyboardType="numeric"
            value={filters.minDistanceKm}
            onChangeText={(minDistanceKm) => setFilters({ minDistanceKm })}
          />
          <TextInput
            style={[styles.input, styles.smallInput]}
            placeholder="Max km"
            keyboardType="numeric"
            value={filters.maxDistanceKm}
            onChangeText={(maxDistanceKm) => setFilters({ maxDistanceKm })}
          />
          <TextInput
            style={[styles.input, styles.smallInput]}
            placeholder="Min rating"
            keyboardType="numeric"
            value={filters.minRating ? String(filters.minRating) : ''}
            onChangeText={(value) => setFilters({ minRating: Math.max(0, Math.min(5, Number(value) || 0)) })}
          />
        </View>
        <View style={styles.sortRow}>
          {SORTS.map((sort) => (
            <TouchableOpacity
              key={sort.value}
              style={[styles.sortButton, filters.sort === sort.value && styles.activeSortButton]}
              onPress={() => setFilters({ sort: sort.value })}
            >
              <Text style={[styles.sortText, filters.sort === sort.value && styles.activeSortText]}>{sort.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && routes.length === 0 ? (
        <ActivityIndicator size="large" color="#2e7d32" style={styles.loader} />
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={renderRoute}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No shared routes match these filters.</Text>}
          ListFooterComponent={
            hasMore ? (
              <Button title={loading ? 'Loading...' : 'Load more'} onPress={() => void loadRoutes(false)} disabled={loading} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f8' },
  filters: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, backgroundColor: '#fff', marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 8 },
  smallInput: { flex: 1 },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortButton: { backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6 },
  activeSortButton: { backgroundColor: '#2e7d32' },
  sortText: { color: '#333', fontWeight: '600', fontSize: 12 },
  activeSortText: { color: '#fff' },
  list: { padding: 12 },
  loader: { marginTop: 24 },
  error: { margin: 12, color: '#c62828', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#777', marginTop: 30 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#222' },
  rating: { color: '#ef6c00', fontWeight: '700' },
  routeLine: { color: '#555', marginTop: 5 },
  meta: { color: '#2e7d32', marginTop: 5, fontWeight: '600' },
  publisher: { color: '#666', marginTop: 5, fontSize: 12 },
  description: { color: '#444', marginTop: 8 },
});
