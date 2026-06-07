import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Alert } from '../components/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';
import {
  savedRouteToSnapshot,
  SavedRoute,
  useSavedRoutes,
} from '../store/savedRoutes';
import { formatDistance, formatDuration } from '../types/routes';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients, Glass } from '../lib/theme';

function AnimatedRouteCard({
  item,
  index,
  onPress,
  onRename,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  item: SavedRoute;
  index: number;
  onPress: () => void;
  onRename: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 14, bounciness: 2, useNativeDriver: true, delay: index * 60 } as any),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
      {/* Left accent strip */}
      <View style={[styles.cardAccent, item.publishedRouteId ? styles.cardAccentPublished : styles.cardAccentUnpublished]} />

      <TouchableOpacity style={styles.cardContent} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.routeName}>{item.name}</Text>
        <Text style={styles.routeLine}>
          {item.originName} → {item.destinationName}
        </Text>
        <Text style={styles.routeMetric}>
          {formatDistance(item.route.distance)} · {formatDuration(item.route.time)}
        </Text>
        {item.publishedRouteId ? (
          <View style={styles.publishedBadge}>
            <Text style={styles.publishedBadgeText}>📋 On Route Board</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onRename}>
          <Text style={styles.actionBtnText}>✏ Edit</Text>
        </TouchableOpacity>
        {item.publishedRouteId ? (
          <TouchableOpacity style={[styles.actionBtn, styles.unpublishBtn]} onPress={onUnpublish}>
            <Text style={styles.actionBtnText}>↩ Unpublish</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, styles.publishBtn]} onPress={onPublish}>
            <Text style={[styles.actionBtnText, styles.publishBtnText]}>↑ Publish</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
          <Text style={[styles.actionBtnText, styles.deleteBtnText]}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function SavedRoutesScreen({ navigation }: any) {
  const { routes, loading, saving, error, loadRoutes, removeRoute, renameRoute, publishRoute, unpublishRoute } =
    useSavedRoutes();
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<SavedRoute | null>(null);
  const [newName, setNewName] = useState('');
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDescription, setPublishDescription] = useState('');

  useEffect(() => { void loadRoutes(); }, [loadRoutes]);

  const openRenameModal = (route: SavedRoute) => {
    setEditingRoute(route);
    setNewName(route.name);
    setRenameModalVisible(true);
  };

  const openPublishModal = (route: SavedRoute) => {
    setEditingRoute(route);
    setPublishTitle(route.name);
    setPublishDescription('');
    setPublishModalVisible(true);
  };

  const handleRename = async () => {
    if (!editingRoute || !newName.trim()) return;
    try {
      await renameRoute(editingRoute.id, newName.trim());
      setRenameModalVisible(false);
      setEditingRoute(null);
    } catch (err) {
      Alert.alert('Could not rename route', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handlePublish = async () => {
    if (!editingRoute || !publishTitle.trim()) return;
    try {
      const publishedRouteId = await publishRoute({
        savedRouteId: editingRoute.id,
        title: publishTitle,
        description: publishDescription,
      });
      setPublishModalVisible(false);
      setEditingRoute(null);
      navigation.navigate('RouteDetail', { routeId: publishedRouteId });
    } catch (err) {
      Alert.alert('Could not publish route', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const confirmDelete = (route: SavedRoute) => {
    Alert.alert('Delete route', `Delete "${route.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await removeRoute(route.id); }
          catch (err) { Alert.alert('Could not delete route', err instanceof Error ? err.message : 'Please try again.'); }
        },
      },
    ]);
  };

  const confirmUnpublish = (route: SavedRoute) => {
    Alert.alert('Unpublish route', 'Remove this route from the public Route Board?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unpublish',
        style: 'destructive',
        onPress: async () => {
          try { await unpublishRoute(route.id); }
          catch (err) { Alert.alert('Could not unpublish route', err instanceof Error ? err.message : 'Please try again.'); }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#0e1428', '#1a1f38']} style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarBtn} onPress={() => navigation.navigate('RouteBoard')}>
          <Text style={styles.topBarBtnText}>📋 Route Board</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBarBtn} onPress={() => void loadRoutes()}>
          <Text style={styles.topBarBtnText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🚴</Text>
          <Text style={styles.emptyTitle}>No saved routes yet</Text>
          <Text style={styles.emptySubtitle}>Plan a route on the map and save it to see it here.</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedRouteCard
              item={item}
              index={index}
              onPress={() => navigation.navigate('Map', { loadRoute: savedRouteToSnapshot(item) })}
              onRename={() => openRenameModal(item)}
              onPublish={() => openPublishModal(item)}
              onUnpublish={() => confirmUnpublish(item)}
              onDelete={() => confirmDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Rename Modal */}
      <Modal visible={renameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rename Route</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Route name"
              placeholderTextColor={Colors.mutedText}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRenameModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRename} disabled={saving}>
                <LinearGradient colors={Gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalAction}>
                  <Text style={styles.modalActionText}>{saving ? 'Saving…' : 'Save'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Publish Modal */}
      <Modal visible={publishModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Publish to Route Board</Text>
            <TextInput
              style={styles.modalInput}
              value={publishTitle}
              onChangeText={setPublishTitle}
              placeholder="Route title (required)"
              placeholderTextColor={Colors.mutedText}
            />
            <TextInput
              style={[styles.modalInput, styles.descInput]}
              value={publishDescription}
              onChangeText={setPublishDescription}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.mutedText}
              multiline
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setPublishModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePublish} disabled={saving}>
                <LinearGradient colors={Gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalAction}>
                  <Text style={styles.modalActionText}>{saving ? 'Publishing…' : 'Publish'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1 },
  listContent: { padding: Spacing.lg },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topBarBtn: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  topBarBtnText: { ...Typography.bodyBold, color: Colors.white },

  errorText: { color: Colors.error, margin: Spacing.md, fontWeight: '700' },

  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl },
  emptyIcon:    { fontSize: 52, marginBottom: Spacing.md },
  emptyTitle:   { ...Typography.h3, marginBottom: Spacing.sm },
  emptySubtitle:{ ...Typography.muted, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    flexDirection: 'column',
    ...Shadows.sm,
  },
  cardAccent:           { height: 3 },
  cardAccentPublished:  { backgroundColor: Colors.primary },
  cardAccentUnpublished:{ backgroundColor: 'rgba(139,143,163,0.4)' },

  cardContent:   { padding: Spacing.lg, paddingBottom: Spacing.sm },
  routeName:     { ...Typography.h4, marginBottom: 4 },
  routeLine:     { ...Typography.muted, marginBottom: 4 },
  routeMetric:   { ...Typography.bodyBold, color: Colors.accent },
  publishedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(249,16,102,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249,16,102,0.3)',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: Spacing.sm,
  },
  publishedBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },

  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: Spacing.sm,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  publishBtn:     { borderColor: 'rgba(255,133,82,0.4)', backgroundColor: 'rgba(255,133,82,0.1)' },
  unpublishBtn:   { borderColor: 'rgba(139,143,163,0.3)' },
  deleteBtn:      { borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.08)', marginLeft: 'auto' },
  actionBtnText:  { ...Typography.label, color: Colors.mutedText, fontWeight: '600' },
  publishBtnText: { color: Colors.accent },
  deleteBtnText:  { color: Colors.error },

  // Modals
  modalOverlay:   { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    width: '88%',
    backgroundColor: Colors.darkSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  modalTitle:  { ...Typography.h3, marginBottom: Spacing.lg },
  modalInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: Colors.white,
    fontSize: 15,
    marginBottom: Spacing.md,
  },
  descInput:      { minHeight: 80, textAlignVertical: 'top' },
  modalBtns:      { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  modalCancel:    { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, justifyContent: 'center' },
  modalCancelText:{ color: Colors.mutedText, fontWeight: '600' },
  modalAction:    { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2 },
  modalActionText:{ color: Colors.white, fontWeight: '700', fontSize: 14 },
});
