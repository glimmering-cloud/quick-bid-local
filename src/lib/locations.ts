export interface Location {
  name: string;
  lat: number;
  lng: number;
  city: string;
}

export const LOCATIONS: Location[] = [
  // Zurich
  { name: "Zurich HB", lat: 47.3769, lng: 8.5417, city: "Zurich" },
  { name: "Zurich Oerlikon", lat: 47.4111, lng: 8.5441, city: "Zurich" },
  { name: "Zurich Stadelhofen", lat: 47.3662, lng: 8.5487, city: "Zurich" },
  { name: "Zurich Altstetten", lat: 47.3912, lng: 8.4887, city: "Zurich" },
  { name: "Zurich Wiedikon", lat: 47.3717, lng: 8.5206, city: "Zurich" },
  // Bern
  { name: "Bern Bahnhof", lat: 46.9480, lng: 7.4474, city: "Bern" },
  { name: "Bern Wankdorf", lat: 46.9631, lng: 7.4669, city: "Bern" },
  { name: "Bern Bümpliz", lat: 46.9414, lng: 7.3916, city: "Bern" },
  // Lausanne
  { name: "Lausanne Gare", lat: 46.5167, lng: 6.6294, city: "Lausanne" },
  { name: "Lausanne Flon", lat: 46.5210, lng: 6.6275, city: "Lausanne" },
  { name: "Lausanne Ouchy", lat: 46.5080, lng: 6.6267, city: "Lausanne" },
  // Geneva
  { name: "Genève Cornavin", lat: 46.2100, lng: 6.1426, city: "Geneva" },
  { name: "Genève Eaux-Vives", lat: 46.1998, lng: 6.1574, city: "Geneva" },
  { name: "Genève Carouge", lat: 46.1842, lng: 6.1390, city: "Geneva" },
  // Basel
  { name: "Basel SBB", lat: 47.5476, lng: 7.5896, city: "Basel" },
  { name: "Basel Marktplatz", lat: 47.5579, lng: 7.5880, city: "Basel" },
  { name: "Basel Badischer Bhf", lat: 47.5640, lng: 7.6075, city: "Basel" },
  // Lucerne
  { name: "Luzern Bahnhof", lat: 47.0502, lng: 8.3093, city: "Lucerne" },
  { name: "Luzern Tribschen", lat: 47.0430, lng: 8.3150, city: "Lucerne" },
  // St. Gallen
  { name: "St. Gallen Bahnhof", lat: 47.4233, lng: 9.3700, city: "St. Gallen" },
  { name: "St. Gallen Marktplatz", lat: 47.4245, lng: 9.3760, city: "St. Gallen" },
  // Winterthur
  { name: "Winterthur HB", lat: 47.5001, lng: 8.7237, city: "Winterthur" },
  { name: "Winterthur Altstadt", lat: 47.4990, lng: 8.7290, city: "Winterthur" },
  // Lugano
  { name: "Lugano Stazione", lat: 46.0037, lng: 8.9511, city: "Lugano" },
  { name: "Lugano Centro", lat: 46.0050, lng: 8.9530, city: "Lugano" },
  // Biel/Bienne
  { name: "Biel/Bienne Bahnhof", lat: 47.1325, lng: 7.2467, city: "Biel/Bienne" },
  // Thun
  { name: "Thun Bahnhof", lat: 46.7545, lng: 7.6295, city: "Thun" },
  // Fribourg
  { name: "Fribourg Gare", lat: 46.8032, lng: 7.1513, city: "Fribourg" },
  // Chur
  { name: "Chur Bahnhof", lat: 46.8530, lng: 9.5288, city: "Chur" },
  // Neuchâtel
  { name: "Neuchâtel Gare", lat: 46.9945, lng: 6.9380, city: "Neuchâtel" },
  // Sion
  { name: "Sion Gare", lat: 46.2333, lng: 7.3597, city: "Sion" },
];

export const CITIES = [...new Set(LOCATIONS.map((l) => l.city))];

export function getLocationsByCity(city: string) {
  return LOCATIONS.filter((l) => l.city === city);
}

export function getDefaultLocation() {
  return LOCATIONS[0];
}

/** City center coordinates for distance matching */
const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Zurich: { lat: 47.3769, lng: 8.5417 },
  Bern: { lat: 46.9480, lng: 7.4474 },
  Lausanne: { lat: 46.5167, lng: 6.6294 },
  Geneva: { lat: 46.2100, lng: 6.1426 },
  Basel: { lat: 47.5476, lng: 7.5896 },
  Lucerne: { lat: 47.0502, lng: 8.3093 },
  "St. Gallen": { lat: 47.4233, lng: 9.3700 },
  Winterthur: { lat: 47.5001, lng: 8.7237 },
  Lugano: { lat: 46.0037, lng: 8.9511 },
  "Biel/Bienne": { lat: 47.1325, lng: 7.2467 },
  Thun: { lat: 46.7545, lng: 7.6295 },
  Fribourg: { lat: 46.8032, lng: 7.1513 },
  Chur: { lat: 46.8530, lng: 9.5288 },
  "Neuchâtel": { lat: 46.9945, lng: 6.9380 },
  Sion: { lat: 46.2333, lng: 7.3597 },
};

/** Determine the nearest city from lat/lng coordinates */
export function getCityFromCoords(lat: number, lng: number): string {
  let nearest = CITIES[0];
  let minDist = Infinity;
  for (const [city, center] of Object.entries(CITY_CENTERS)) {
    const d = Math.sqrt((lat - center.lat) ** 2 + (lng - center.lng) ** 2);
    if (d < minDist) {
      minDist = d;
      nearest = city;
    }
  }
  return nearest;
}

/** Get location names belonging to a city for DB filtering */
export function getLocationNamesForCity(city: string): string[] {
  return LOCATIONS.filter((l) => l.city === city).map((l) => l.name);
}
