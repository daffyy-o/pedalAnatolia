import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Modal, TextInput, Button, Platform, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import MapView, { Polyline, Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
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

const TURKEY = {
  latitude: 39.92077,
  longitude: 32.85411,
  latitudeDelta: 10,
  longitudeDelta: 15,
};

export default function MapScreen({ route: navRoute, navigation }: any) {
  const { avoidSchoolZones } = usePreferences();
  const overrides = useSchoolZoneReports((s) => s.overrides);
  const schoolZones = useMemo(() => getSchoolZoneFeatures(overrides), [overrides]);
  const { addRoute, saving: routeSaving } = useSavedRoutes();
  const { users, currentUserId, addMonthlyDistance, logout } = useAuth();
  const currentUser = users.find((u) => u.id === currentUserId);
  const comments = useLocationComments((s) => s.comments);
  const addComment = useLocationComments((s) => s.addComment);

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
  const routeDoneKey = route ? `${origin?.lat}-${origin?.lon}-${destination?.lat}-${destination?.lon}-${Math.round(route.distance)}` : '';
  const routeDone = Boolean(routeDoneKey && routeDoneKey === completedRouteKey);
  const monthDistance = currentUser?.monthlyDistanceMeters[currentMonthKey()] || 0;
  const hiddenCounters = getHiddenCounters(users, schoolZones, comments);
  // Hidden demo stats: connect this to a button if judges ask to show the counters.
  const showHiddenCounters = () =>
    Alert.alert(
      'App counters',
      `School zones: ${hiddenCounters.schoolZones}\nUsers: ${hiddenCounters.users}\nAdmins: ${hiddenCounters.admins}\nComments: ${hiddenCounters.comments}`
    );
  void showHiddenCounters;

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

  const submitComment = () => {
    if (!selectedCommentPoint || !newComment.trim() || !currentUser) return;
    addComment({
      lat: selectedCommentPoint.lat,
      lon: selectedCommentPoint.lon,
      text: newComment,
      userName: currentUser.name,
    });
    setNewComment('');
    setCommentModalVisible(false);
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
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder={!origin ? 'Search start...' : 'Search end...'}
          onPlaceSelect={onSearchPlace}
        />
        <Text style={styles.hint}>{hint}</Text>
        <View style={styles.headerButtons}>
          {(origin || destination || route) && (
            <Text style={styles.headerButton} onPress={clearAll}>
              Clear
            </Text>
          )}
          <Text style={styles.headerButton} onPress={() => navigation.navigate('SavedRoutes')}>
            Saved
          </Text>
          <Text style={styles.headerButton} onPress={() => navigation.navigate('RouteBoard')}>
            Board
          </Text>
          <Text
            style={[styles.headerButton, commentMode && styles.activeHeaderButton]}
            onPress={() => setCommentMode((value) => !value)}
          >
            Comment
          </Text>
          <Text style={styles.headerButton} onPress={() => navigation.navigate('Settings')}>
            Settings
          </Text>
          {currentUser?.role === 'admin' && (
            <Text style={styles.headerButton} onPress={() => navigation.navigate('AdminDashboard')}>
              Admin
            </Text>
          )}
          <Text
            style={styles.headerButton}
            onPress={() => void logout()}
          >
            Logout
          </Text>
        </View>
        {currentUser && (
          <Text style={styles.userBadge}>
            {currentUser.name} ({currentUser.role}) - this month {formatKm(monthDistance)}
          </Text>
        )}
      </View>

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
              fillColor="rgba(255, 0, 0, 0.2)"
              strokeColor="rgba(200, 0, 0, 0.8)"
              strokeWidth={2}
              tappable={false}
            />
          ))}

        {origin && (
          <Marker
            key={`${zoneLayerKey}-start-${origin.lat}-${origin.lon}`}
            coordinate={{ latitude: origin.lat, longitude: origin.lon }}
            title="Start"
            pinColor="green"
          />
        )}
        {destination && (
          <Marker
            key={`${zoneLayerKey}-end-${destination.lat}-${destination.lon}`}
            coordinate={{ latitude: destination.lat, longitude: destination.lon }}
            title="End"
            pinColor="red"
          />
        )}
        {comments.map((comment) => (
          <Marker
            key={comment.id}
            coordinate={{ latitude: comment.lat, longitude: comment.lon }}
            title="★ Location comments"
            description="Tap to read comments"
            pinColor="#fbc02d"
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
            strokeColor="#4A90E2"
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.overlay}>
        {loading && <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />}
        {errorText && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        )}
        {route && !errorText && (
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
                Alert.alert('Route done', `${formatKm(route.distance)} added to your monthly distance.`);
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
        )}
      </View>

      <Modal visible={saveModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Save route</Text>
            <TextInput
              style={styles.input}
              value={customRouteName}
              onChangeText={setCustomRouteName}
              placeholder="Route name"
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setSaveModalVisible(false)} color="#888" />
              <Button
                title={routeSaving ? 'Saving...' : 'Save'}
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
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={commentModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={20}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Location comments</Text>
            <ScrollView style={styles.commentScroll} keyboardShouldPersistTaps="handled">
              {commentsNearSelected.length === 0 ? (
                <Text style={styles.emptyComment}>No comments here yet.</Text>
              ) : (
                commentsNearSelected.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Text style={styles.commentAuthor}>{comment.userName}</Text>
                    <Text>{comment.text}</Text>
                  </View>
                ))
              )}
              <TextInput
                style={[styles.input, styles.commentInput]}
                placeholder="Add a road or location note"
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
            </ScrollView>
            <View style={styles.modalButtons}>
              <Button title="Close" onPress={() => setCommentModalVisible(false)} color="#888" />
              <Button title="Add comment" onPress={submitComment} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { position: 'absolute', top: 10, width: '100%', paddingHorizontal: 10, zIndex: 2 },
  hint: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 6,
    borderRadius: 6,
    fontSize: 12,
    color: '#444',
    marginTop: 4,
    textAlign: 'center',
  },
  headerButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, flexWrap: 'wrap' },
  headerButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A90E2',
    elevation: 2,
  },
  activeHeaderButton: { backgroundColor: '#2e7d32', color: 'white' },
  userBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
  map: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  overlay: { position: 'absolute', bottom: 20, alignSelf: 'center', width: '90%', zIndex: 2 },
  loader: { marginVertical: 10 },
  errorBox: { backgroundColor: 'red', padding: 10, borderRadius: 8 },
  errorText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', maxHeight: '88%', backgroundColor: 'white', borderRadius: 8, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 10, marginBottom: 16 },
  commentScroll: { maxHeight: 320 },
  commentInput: { minHeight: 70, textAlignVertical: 'top', marginTop: 10 },
  emptyComment: { color: '#777', marginBottom: 8 },
  commentItem: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
  commentAuthor: { fontWeight: 'bold', color: '#2e7d32', marginBottom: 2 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
