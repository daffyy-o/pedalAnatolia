import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteBoardSort, useRouteBoard, PublishedRoute } from '../store/routeBoard';
import { formatDistance, formatDuration } from '../types/routes';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients, Glass } from '../lib/theme';

const SORTS: Array<{ label: string; value: RouteBoardSort }> = [
  { label: '🆕 Newest', value: 'newest' },
  { label: '⭐ Rating', value: 'rating' },
  { label: '🔥 Popular', value: 'rides' },
  { label: '📏 Shortest', value: 'shortest' },
  { label: '🛣️ Longest', value: 'longest' },
];

function RouteCard({ item, index, onPress }: { item: PublishedRoute; index: number; onPress: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 50, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 14, bounciness: 2, useNativeDriver: true, delay: index * 50 } as any),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {item.ratingAverage.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.routeLine} numberOfLines={1}>
          {item.originName} → {item.destinationName}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{formatDistance(item.route.distance)}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{formatDuration(item.route.time)}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>🚴 {item.rideCount}</Text>
          </View>
        </View>
        <Text style={styles.publisher}>by {item.ownerName}</Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RouteBoardScreen({ navigation }: any) {
  const { routes, filters, loading, error, hasMore, setFilters, loadRoutes } = useRouteBoard();

  useEffect(() => { void loadRoutes(true); }, [filters, loadRoutes]);

  return (
    <LinearGradient colors={['#0e1428', '#1a1f38']} style={styles.screen}>
      {/* Filter panel */}
      <View style={styles.filterPanel}>
        {/* Search */}
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes, places, riders…"
            placeholderTextColor={Colors.mutedText}
            value={filters.search}
            onChangeText={(search) => setFilters({ search })}
          />
        </View>

        {/* Distance / rating filters */}
        <View style={styles.filterRow}>
          <TextInput
            style={styles.filterInput}
            placeholder="Min km"
            placeholderTextColor={Colors.mutedText}
            keyboardType="numeric"
            value={filters.minDistanceKm}
            onChangeText={(minDistanceKm) => setFilters({ minDistanceKm })}
          />
          <TextInput
            style={styles.filterInput}
            placeholder="Max km"
            placeholderTextColor={Colors.mutedText}
            keyboardType="numeric"
            value={filters.maxDistanceKm}
            onChangeText={(maxDistanceKm) => setFilters({ maxDistanceKm })}
          />
          <TextInput
            style={styles.filterInput}
            placeholder="Min ★"
            placeholderTextColor={Colors.mutedText}
            keyboardType="numeric"
            value={filters.minRating ? String(filters.minRating) : ''}
            onChangeText={(value) =>
              setFilters({ minRating: Math.max(0, Math.min(5, Number(value) || 0)) })
            }
          />
        </View>

        {/* Sort pills */}
        <View style={styles.sortRow}>
          {SORTS.map((sort) =>
            filters.sort === sort.value ? (
              <LinearGradient
                key={sort.value}
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sortPillActive}
              >
                <TouchableOpacity onPress={() => setFilters({ sort: sort.value })}>
                  <Text style={styles.sortPillTextActive}>{sort.label}</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                key={sort.value}
                style={styles.sortPill}
                onPress={() => setFilters({ sort: sort.value })}
              >
                <Text style={styles.sortPillText}>{sort.label}</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && routes.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <RouteCard
              item={item}
              index={index}
              onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>🗺️</Text>
              <Text style={styles.emptyText}>No routes match these filters.</Text>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => void loadRoutes(false)}
                disabled={loading}
              >
                <Text style={styles.loadMoreText}>
                  {loading ? 'Loading…' : '↓ Load more'}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  filterPanel: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  searchIcon:  { fontSize: 15 },
  searchInput: { flex: 1, color: Colors.white, fontSize: 14, height: 36 },

  filterRow:  { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  filterInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    color: Colors.white,
    fontSize: 13,
    textAlign: 'center',
  },

  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  sortPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
  },
  sortPillActive: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    ...Shadows.sm,
  },
  sortPillText:      { ...Typography.caption, color: Colors.mutedText, fontWeight: '600' },
  sortPillTextActive:{ ...Typography.caption, color: Colors.white, fontWeight: '700' },

  listContent: { padding: Spacing.md },
  errorText:   { color: Colors.error, margin: Spacing.md, fontWeight: '700' },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, paddingTop: Spacing.xxxl },
  emptyIcon:   { fontSize: 48, marginBottom: Spacing.md },
  emptyText:   { ...Typography.muted, textAlign: 'center' },

  // Route card
  card: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs, gap: Spacing.sm },
  cardTitle:  { ...Typography.h4, flex: 1 },

  ratingBadge: {
    backgroundColor: 'rgba(255,133,82,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,133,82,0.4)',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: Colors.accent },

  routeLine:  { ...Typography.muted, marginBottom: Spacing.sm },

  metaRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm, flexWrap: 'wrap' },
  metaPill: {
    backgroundColor: 'rgba(249,16,102,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249,16,102,0.2)',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  metaPillText: { fontSize: 11, fontWeight: '600', color: Colors.primary },

  publisher:   { ...Typography.caption, marginBottom: Spacing.xs },
  description: { ...Typography.muted, lineHeight: 18, marginTop: Spacing.xs },

  loadMoreBtn: {
    borderWidth: 1,
    borderColor: 'rgba(249,16,102,0.35)',
    borderRadius: BorderRadius.pill,
    padding: Spacing.md,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  loadMoreText: { color: Colors.primary, fontWeight: '700' },
});
