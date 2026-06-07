import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Alert } from '../components/CustomAlert';
import MapView, { Polyline, Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import SearchBar from '../components/SearchBar';
import RouteSummary from '../components/RouteSummary';
import { useMapRouting } from '../hooks/useMapRouting';
import { getSchoolZoneFeatures, zoneToMapCoords } from '../lib/schoolZones';
import { usePreferences } from '../store/preferences';
import { useSchoolZoneReports } from '../store/schoolZoneReports';
import { useSavedRoutes } from '../store/savedRoutes';
import { useAuth, currentMonthKey, formatKm } from '../store/auth';
import { useLocationComments, LocationComment } from '../store/locationComments';
import { getHiddenCounters } from '../lib/stats';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients, Glass } from '../lib/theme';

const TURKEY = {
  latitude: 39.92077,
  longitude: 32.85411,
  latitudeDelta: 10,
  longitudeDelta: 15,
};

function PillButton({
  label,
  icon,
  onPress,
  active = false,
  variant = 'default',
}: {
  label: string;
  icon?: string;
  onPress: () => void;
  active?: boolean;
  variant?: 'default' | 'danger';
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {active ? (
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pillActive}
          >
            {icon ? <Text style={styles.pillIcon}>{icon}</Text> : null}
            <Text style={styles.pillTextActive}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.pill, variant === 'danger' && styles.pillDanger]}>
            {icon ? <Text style={styles.pillIcon}>{icon}</Text> : null}
            <Text style={[styles.pillText, variant === 'danger' && styles.pillTextDanger]}>
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function StyledModal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, speed: 16, bounciness: 3, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible, fadeAnim, scaleAnim]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.modalTitle}>{title}</Text>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function MapScreen({ route: navRoute, navigation }: any) {
  const { avoidSchoolZones } = usePreferences();
  const overrides = useSchoolZoneReports((s) => s.overrides);
  const schoolZones = useMemo(() => getSchoolZoneFeatures(overrides), [overrides]);
  const { addRoute, saving: routeSaving } = useSavedRoutes();
  const { users, currentUserId, addMonthlyDistance, logout } = useAuth();
  const currentUser = users.find((u) => u.id === currentUserId);
  const comments = useLocationComments((s) => s.comments);
  const addComment = useLocationComments((s) => s.addComment);
  const deleteComment = useLocationComments((s) => s.deleteComment);

  const {
    origin,
    destination,
    originName,
    destinationName,
    route,
    savedRouteId,
    publishedRouteId,
    errorText,
    loading,
    hint,
    routeLineKey,
    mapRenderVersion,
    clearAll,
    onMapTap,
    onSearchPlace,
    loadSavedRoute,
  } = useMapRouting(avoidSchoolZones, schoolZones);

  const mapRef = useRef<MapView>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [customRouteName, setCustomRouteName] = useState('');
  const [commentMode, setCommentMode] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedCommentPoint, setSelectedCommentPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [completedRouteKey, setCompletedRouteKey] = useState('');

  const zoneLayerKey = `${mapRenderVersion}-${avoidSchoolZones}-${schoolZones.length}`;
  const routeDoneKey = route
    ? `${origin?.lat}-${origin?.lon}-${destination?.lat}-${destination?.lon}-${Math.round(route.distance)}`
    : '';
  const routeDone = Boolean(routeDoneKey && routeDoneKey === completedRouteKey);
  const monthDistance = currentUser?.monthlyDistanceMeters[currentMonthKey()] || 0;

  const hiddenCounters = getHiddenCounters(users, schoolZones, comments);
  const showHiddenCounters = () =>
    Alert.alert(
      'App counters',
      `School zones: ${hiddenCounters.schoolZones}\nUsers: ${hiddenCounters.users}\nAdmins: ${hiddenCounters.admins}\nComments: ${hiddenCounters.comments}`
    );
  void showHiddenCounters;

  // Summary card animation
  const summaryAnim = useRef(new Animated.Value(100)).current;
  const summaryOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (route) {
      Animated.parallel([
        Animated.spring(summaryAnim, { toValue: 0, speed: 12, bounciness: 4, useNativeDriver: true }),
        Animated.timing(summaryOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      summaryAnim.setValue(100);
      summaryOpacity.setValue(0);
    }
  }, [route, summaryAnim, summaryOpacity]);

  const handleMapTap = (latitude: number, longitude: number) => {
    if (commentMode) {
      setSelectedCommentPoint({ lat: latitude, lon: longitude });
      setNewComment('');
      setCommentModalVisible(true);
      setCommentMode(false);
      return;
    }
    onMapTap(latitude, longitude);
  };

  const commentsNearSelected = selectedCommentPoint
    ? comments.filter(
        (comment) =>
          Math.abs(comment.lat - selectedCommentPoint.lat) < 0.00001 &&
          Math.abs(comment.lon - selectedCommentPoint.lon) < 0.00001
      )
    : [];

  const openCommentPoint = (comment: LocationComment) => {
    setSelectedCommentPoint({ lat: comment.lat, lon: comment.lon });
    setNewComment('');
    setCommentModalVisible(true);
  };

  const submitComment = async () => {
    if (!selectedCommentPoint || !newComment.trim() || !currentUser) return;
    try {
      await addComment({
        lat: selectedCommentPoint.lat,
        lon: selectedCommentPoint.lon,
        text: newComment,
      });
      setNewComment('');
      setCommentModalVisible(false);
    } catch (err: any) {
      Alert.alert('Could not save note', err.message || 'Please try again.');
    }
  };

  useEffect(() => {
    if (navRoute?.params?.loadRoute) {
      loadSavedRoute(navRoute.params.loadRoute);
    }
  }, [navRoute?.params?.loadRoute, loadSavedRoute]);

  useEffect(() => {
    setCompletedRouteKey('');
  }, [routeDoneKey]);

  useEffect(() => {
    if (route && route.geometry.coordinates.length > 0) {
      const coords = route.geometry.coordinates.map((c) => ({
        latitude: c[1],
        longitude: c[0],
      }));
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [routeLineKey]);

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={TURKEY}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          handleMapTap(latitude, longitude);
        }}
      >
        {avoidSchoolZones &&
          schoolZones.map((zone) => (
            <Polygon
              key={`${zoneLayerKey}-zone-${String(zone.id)}`}
              coordinates={zoneToMapCoords(zone)}
              fillColor={Colors.schoolZone}
              strokeColor={Colors.schoolZoneStroke}
              strokeWidth={2}
              tappable={false}
            />
          ))}

        {origin && (
          <Marker
            key={`${zoneLayerKey}-start-${origin.lat}-${origin.lon}`}
            coordinate={{ latitude: origin.lat, longitude: origin.lon }}
            title="Start"
            pinColor={Colors.startMarker}
          />
        )}
        {destination && (
          <Marker
            key={`${zoneLayerKey}-end-${destination.lat}-${destination.lon}`}
            coordinate={{ latitude: destination.lat, longitude: destination.lon }}
            title="End"
            pinColor={Colors.endMarker}
          />
        )}
        {comments.map((comment) => (
          <Marker
            key={comment.id}
            coordinate={{ latitude: comment.lat, longitude: comment.lon }}
            title="★ Location comments"
            description="Tap to read comments"
            pinColor="#f59e0b"
            onPress={() => openCommentPoint(comment)}
          />
        ))}
        {route && (
          <Polyline
            key={routeLineKey}
            coordinates={route.geometry.coordinates.map((c) => ({
              latitude: c[1],
              longitude: c[0],
            }))}
            strokeColor={Colors.routeLine}
            strokeWidth={5}
          />
        )}
      </MapView>

      {/* Top overlay: search + nav buttons */}
      <View style={styles.topOverlay}>
        <SearchBar
          placeholder={!origin ? 'Search start location...' : 'Search destination...'}
          onPlaceSelect={onSearchPlace}
        />

        {hint ? (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        ) : null}

        <View style={styles.pillRow}>
          {(origin || destination || route) && (
            <PillButton label="Clear" icon="✕" onPress={clearAll} />
          )}
          <PillButton label="Saved" icon="⭐" onPress={() => navigation.navigate('SavedRoutes')} />
          <PillButton label="Board" icon="📋" onPress={() => navigation.navigate('RouteBoard')} />
          <PillButton
            label="Note"
            icon="💬"
            onPress={() => setCommentMode((v) => !v)}
            active={commentMode}
          />
          <PillButton label="Settings" icon="⚙️" onPress={() => navigation.navigate('Settings')} />
          {currentUser?.role === 'admin' && (
            <PillButton label="Admin" icon="👑" onPress={() => navigation.navigate('AdminDashboard')} />
          )}
          <PillButton label="Logout" icon="🚪" onPress={() => void logout()} variant="danger" />
        </View>

        {currentUser && (
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>
              {currentUser.name} · 🚴 {formatKm(monthDistance)} this month
            </Text>
          </View>
        )}
      </View>

      {/* Bottom overlay: loading / error / route summary */}
      <View style={styles.bottomOverlay}>
        {loading && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Calculating route…</Text>
          </View>
        )}

        {errorText && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {errorText}</Text>
          </View>
        )}

        {route && !errorText && (
          <Animated.View
            style={{
              opacity: summaryOpacity,
              transform: [{ translateY: summaryAnim }],
            }}
          >
            <RouteSummary
              distance={route.distance}
              time={route.time}
              instructions={route.instructions}
              onSaveRoute={() => {
                setCustomRouteName(`From ${originName} to ${destinationName}`);
                setSaveModalVisible(true);
              }}
              onRouteDone={async () => {
                if (!route || routeDone) return;
                try {
                  await addMonthlyDistance(route.distance, {
                    savedRouteId,
                    publishedRouteId,
                    durationMs: route.time,
                  });
                  setCompletedRouteKey(routeDoneKey);
                  Alert.alert('Route done! 🎉', `${formatKm(route.distance)} added to your monthly distance.`);
                } catch (error) {
                  Alert.alert(
                    'Could not record route',
                    error instanceof Error ? error.message : 'Please try again.'
                  );
                }
              }}
              routeDone={routeDone}
              schoolZonesAvoided={avoidSchoolZones}
            />
          </Animated.View>
        )}
      </View>

      {/* Save Route Modal */}
      <StyledModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        title="Save Route"
      >
        <TextInput
          style={styles.modalInput}
          value={customRouteName}
          onChangeText={setCustomRouteName}
          placeholder="Route name"
          placeholderTextColor={Colors.mutedText}
        />
        <View style={styles.modalButtonRow}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setSaveModalVisible(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={routeSaving}
            onPress={async () => {
              if (origin && destination && route) {
                try {
                  await addRoute({
                    name: customRouteName.trim() || 'Saved route',
                    origin,
                    destination,
                    originName,
                    destinationName,
                    route,
                    routingProfile: avoidSchoolZones ? 'bike_school_zones' : 'bike',
                  });
                  setSaveModalVisible(false);
                } catch (error) {
                  Alert.alert(
                    'Could not save route',
                    error instanceof Error ? error.message : 'Please try again.'
                  );
                }
              }
            }}
          >
            <LinearGradient colors={Gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalSaveButton}>
              <Text style={styles.modalSaveText}>{routeSaving ? 'Saving…' : 'Save'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </StyledModal>

      {/* Comment Modal */}
      <Modal visible={commentModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={20}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>📍 Location Notes</Text>
            <ScrollView style={styles.commentScroll} keyboardShouldPersistTaps="handled">
              {commentsNearSelected.length === 0 ? (
                <Text style={styles.emptyCommentText}>No notes here yet.</Text>
              ) : (
                commentsNearSelected.map((comment) => {
                  const canDeleteComment = currentUser && (comment.userId === currentUserId || currentUser.role === 'admin');
                  return (
                    <View key={comment.id} style={styles.commentItem}>
                      <View style={styles.commentHeaderRow}>
                        <Text style={styles.commentAuthor}>{comment.userName}</Text>
                        {canDeleteComment && (
                          <TouchableOpacity onPress={async () => {
                            try {
                              await deleteComment(comment.id);
                            } catch (err: any) {
                              Alert.alert('Could not delete note', err.message || 'Please try again.');
                            }
                          }}>
                            <Text style={styles.deleteCommentText}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.commentBody}>{comment.text}</Text>
                    </View>
                  );
                })
              )}
              <TextInput
                style={[styles.modalInput, styles.commentInput]}
                placeholder="Add a road or location note…"
                placeholderTextColor={Colors.mutedText}
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
            </ScrollView>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCommentModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitComment}>
                <LinearGradient colors={Gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalSaveButton}>
                  <Text style={styles.modalSaveText}>Add Note</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { ...StyleSheet.absoluteFillObject },

  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: 10,
    width: '100%',
    paddingHorizontal: Spacing.md,
    zIndex: 10,
  },
  hintContainer: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    alignSelf: 'center',
  },
  hintText: { ...Typography.caption, color: Colors.mutedText, textAlign: 'center' },

  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
    justifyContent: 'flex-end',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    ...Shadows.sm,
  },
  pillDanger: {
    borderColor: 'rgba(239,68,68,0.3)',
  },
  pillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    ...Shadows.sm,
  },
  pillIcon:         { fontSize: 11, marginRight: 4 },
  pillText:         { ...Typography.caption, color: Colors.white, fontWeight: '600' },
  pillTextDanger:   { color: Colors.error },
  pillTextActive:   { ...Typography.caption, color: Colors.white, fontWeight: '700' },

  userBadge: {
    alignSelf: 'flex-end',
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
    ...Shadows.sm,
  },
  userBadgeText: { ...Typography.caption, color: Colors.accent, fontWeight: '600' },

  // Bottom overlay
  bottomOverlay: {
    position: 'absolute',
    bottom: Spacing.xl,
    alignSelf: 'center',
    width: '92%',
    zIndex: 10,
  },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.md,
    gap: Spacing.sm,
  },
  loadingText: { ...Typography.caption, color: Colors.white },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: { color: Colors.error, fontWeight: '600', textAlign: 'center', fontSize: 13 },

  // Modals
  modalOverlay:  { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modalContainer: {
    width: '86%',
    maxHeight: '88%',
    backgroundColor: Colors.darkSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  modalTitle:   { ...Typography.h3, marginBottom: Spacing.lg },
  modalInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: Colors.white,
    fontSize: 15,
    marginBottom: Spacing.lg,
  },
  commentInput:     { minHeight: 72, textAlignVertical: 'top', marginTop: Spacing.sm },
  commentScroll:    { maxHeight: 300 },
  emptyCommentText: { ...Typography.muted, marginBottom: Spacing.sm },
  commentItem:      { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', paddingVertical: Spacing.sm, marginBottom: Spacing.xs },
  commentAuthor:    { ...Typography.bodyBold, color: Colors.accent },
  commentBody:      { ...Typography.body, color: Colors.white },
  commentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  deleteCommentText: { color: Colors.error, fontSize: 13, fontWeight: '700', padding: 2 },

  modalButtonRow:   { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  modalCancelButton:{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, justifyContent: 'center' },
  modalCancelText:  { color: Colors.mutedText, fontWeight: '600' },
  modalSaveButton:  { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2 },
  modalSaveText:    { color: Colors.white, fontWeight: '700', fontSize: 14 },
});
