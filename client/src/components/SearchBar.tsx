import React, { useRef, useState } from 'react';
import {
  Animated,
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { geocodeSearch, Place } from '../lib/geocoder';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients, Glass } from '../lib/theme';

interface SearchBarProps {
  onPlaceSelect: (place: Place) => void;
  placeholder: string;
}

export default function SearchBar({ onPlaceSelect, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const btnScale = useRef(new Animated.Value(1)).current;

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
    setQuery(place.display_name.split(',')[0]);
    setResults([]);
  };

  const handlePressIn = () =>
    Animated.spring(btnScale, { toValue: 0.93, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.mutedText}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <Pressable
          onPress={handleSearch}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isSearching}
        >
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.searchButton}
            >
              <Text style={styles.searchButtonText}>
                {isSearching ? '…' : 'Go'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => `${item.lat}-${item.lon}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
                <Text style={styles.resultText} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.xs, zIndex: 10 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Glass.background,
    borderWidth: Glass.borderWidth,
    borderColor: Glass.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadows.md,
    gap: Spacing.sm,
  },
  searchIcon:   { fontSize: 16, color: Colors.mutedText },
  input: {
    flex: 1,
    height: 40,
    color: Colors.white,
    fontSize: 14,
  },
  searchButton: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    minWidth: 40,
    alignItems: 'center',
  },
  searchButtonText: { color: Colors.white, fontWeight: '700', fontSize: 13 },

  resultsContainer: {
    backgroundColor: Colors.darkSurface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: 180,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    ...Shadows.lg,
    overflow: 'hidden',
  },
  resultItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  resultText: { ...Typography.body, color: Colors.white },
});
