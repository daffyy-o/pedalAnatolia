import axios from 'axios';

export interface Place {
  display_name: string;
  lat: string;
  lon: string;
}

export const geocodeSearch = async (query: string): Promise<Place[]> => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        countrycodes: 'tr',
        limit: 5,
      },
      headers: {
        // Nominatim requests require User-Agent
        'User-Agent': 'PedalAnatolia/1.0 (Student Project)',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Geocoding failed", error);
    return [];
  }
};
