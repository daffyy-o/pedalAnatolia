import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  savedRouteToSnapshot,
  SavedRoute,
  useSavedRoutes,
} from '../store/savedRoutes';
import { formatDistance, formatDuration } from '../types/routes';

export default function SavedRoutesScreen({ navigation }: any) {
  const {
    routes,
    loading,
    saving,
    error,
    loadRoutes,
    removeRoute,
    renameRoute,
    publishRoute,
    unpublishRoute,
  } = useSavedRoutes();
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<SavedRoute | null>(null);
  const [newName, setNewName] = useState('');
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDescription, setPublishDescription] = useState('');

  useEffect(() => {
    void loadRoutes();
  }, [loadRoutes]);

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
    } catch (renameError) {
      Alert.alert('Could not rename route', renameError instanceof Error ? renameError.message : 'Please try again.');
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
    } catch (publishError) {
      Alert.alert('Could not publish route', publishError instanceof Error ? publishError.message : 'Please try again.');
    }
  };

  const confirmDelete = (route: SavedRoute) => {
    Alert.alert('Delete route', `Delete "${route.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeRoute(route.id);
          } catch (deleteError) {
            Alert.alert('Could not delete route', deleteError instanceof Error ? deleteError.message : 'Please try again.');
          }
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
          try {
            await unpublishRoute(route.id);
          } catch (unpublishError) {
            Alert.alert(
              'Could not unpublish route',
              unpublishError instanceof Error ? unpublishError.message : 'Please try again.'
            );
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: SavedRoute }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => navigation.navigate('Map', { loadRoute: savedRouteToSnapshot(item) })}
      >
        <Text style={styles.routeName}>{item.name}</Text>
        <Text style={styles.routeDetails}>
          {item.originName} -> {item.destinationName}
        </Text>
        <Text style={styles.metric}>
          {formatDistance(item.route.distance)} • {formatDuration(item.route.time)}
        </Text>
        {item.publishedRouteId ? <Text style={styles.published}>Published on Route Board</Text> : null}
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={() => openRenameModal(item)}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        {item.publishedRouteId ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => confirmUnpublish(item)}>
            <Text style={styles.buttonText}>Unpublish</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => openPublishModal(item)}>
            <Text style={styles.buttonText}>Publish</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item)}>
          <Text style={styles.buttonTextWhite}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Button title="Route Board" onPress={() => navigation.navigate('RouteBoard')} />
        <Button title="Refresh" onPress={() => void loadRoutes()} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={styles.loader} />
      ) : routes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No saved routes yet.</Text>
          <Text style={styles.emptySubtext}>New saved routes are stored in your Supabase account.</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal visible={renameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Rename Route</Text>
            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Route name" />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setRenameModalVisible(false)} color="#888" />
              <Button title={saving ? 'Saving...' : 'Save'} onPress={handleRename} disabled={saving} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={publishModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Publish Route</Text>
            <TextInput style={styles.input} value={publishTitle} onChangeText={setPublishTitle} placeholder="Title" />
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={publishDescription}
              onChangeText={setPublishDescription}
              placeholder="Description (optional)"
              multiline
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setPublishModalVisible(false)} color="#888" />
              <Button title={saving ? 'Publishing...' : 'Publish'} onPress={handlePublish} disabled={saving} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff' },
  listContainer: { padding: 15 },
  loader: { marginTop: 30 },
  error: { margin: 12, color: '#c62828', fontWeight: '700' },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemContent: { marginBottom: 12 },
  routeName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#333' },
  routeDetails: { fontSize: 12, color: '#666' },
  metric: { color: '#2e7d32', marginTop: 5, fontWeight: '600' },
  published: { color: '#1565c0', marginTop: 5, fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  editButton: { backgroundColor: '#eee', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  secondaryButton: { backgroundColor: '#e3f2fd', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  deleteButton: { backgroundColor: '#e74c3c', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  buttonText: { color: '#333', fontWeight: '600', fontSize: 12 },
  buttonTextWhite: { color: 'white', fontWeight: '600', fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '84%', backgroundColor: 'white', borderRadius: 8, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, fontSize: 16, marginBottom: 12 },
  descriptionInput: { minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
