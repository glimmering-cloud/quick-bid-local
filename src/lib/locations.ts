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
];

export const CITIES = [...new Set(LOCATIONS.map((l) => l.city))];

export function getLocationsByCity(city: string) {
  return LOCATIONS.filter((l) => l.city === city);
}

export function getDefaultLocation() {
  return LOCATIONS[0];
}
