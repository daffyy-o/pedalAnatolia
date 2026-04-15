import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { geocodeSearch, Place } from '../lib/geocoder';

interface SearchBarProps {
  onPlaceSelect: (place: Place) => void;
  placeholder: string;
}

export default function SearchBar({ onPlaceSelect, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    const result = await geocodeSearch(query);
    setResults(result);
    setIsSearching(false);
    Keyboard.dismiss();
  };

  const handleSelect = (place: Place) => {
    onPlaceSelect(place);
    setQuery(place.display_name.split(',')[0]); // simplified display
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <Button title="Search" onPress={handleSearch} disabled={isSearching} />
      </View>
      
      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => `${item.lat}-${item.lon}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
                <Text numberOfLines={2}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 5,
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    height: 40,
  },
  resultsContainer: {
    backgroundColor: 'white',
    maxHeight: 150,
    marginTop: 2,
    borderRadius: 8,
    elevation: 3,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  }
});
