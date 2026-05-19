import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Button } from 'react-native';
import { useSavedRoutes, SavedRoute } from '../store/savedRoutes';

export default function SavedRoutesScreen({ navigation }: any) {
  const { routes, removeRoute, renameRoute } = useSavedRoutes();
  
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const openRenameModal = (route: SavedRoute) => {
    setEditingRouteId(route.id);
    setNewName(route.name);
    setRenameModalVisible(true);
  };

  const handleRename = () => {
    if (editingRouteId && newName.trim() !== '') {
      renameRoute(editingRouteId, newName.trim());
    }
    setRenameModalVisible(false);
    setEditingRouteId(null);
  };

  const handleSelectRoute = (route: SavedRoute) => {
    // Navigate back to map with the route data
    navigation.navigate('Map', {
      loadRoute: {
        origin: route.origin,
        destination: route.destination,
        originName: route.originName,
        destinationName: route.destinationName,
      }
    });
  };

  const renderItem = ({ item }: { item: SavedRoute }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemContent} 
        onPress={() => handleSelectRoute(item)}
      >
        <Text style={styles.routeName}>{item.name}</Text>
        <Text style={styles.routeDetails}>
          {item.originName} → {item.destinationName}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={() => openRenameModal(item)}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => removeRoute(item.id)}>
          <Text style={styles.buttonTextWhite}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {routes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No saved routes yet.</Text>
          <Text style={styles.emptySubtext}>Save routes from the Map screen to easily access them here.</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Rename Route</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Route name"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <View style={styles.modalBtn}>
                <Button title="Cancel" onPress={() => setRenameModalVisible(false)} color="#888" />
              </View>
              <View style={styles.modalBtn}>
                <Button title="Save" onPress={handleRename} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 15,
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  routeDetails: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 12,
  },
  buttonTextWhite: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    marginLeft: 10,
  }
});
