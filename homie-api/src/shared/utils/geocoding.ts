// Known city coordinates (major PT + ES + EU cities)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // Portugal
  'lisboa': { lat: 38.7223, lng: -9.1393 },
  'lisbon': { lat: 38.7223, lng: -9.1393 },
  'porto': { lat: 41.1579, lng: -8.6291 },
  'braga': { lat: 41.5518, lng: -8.4229 },
  'coimbra': { lat: 40.2033, lng: -8.4103 },
  'faro': { lat: 37.0194, lng: -7.9322 },
  'aveiro': { lat: 40.6405, lng: -8.6538 },
  'leiria': { lat: 39.7437, lng: -8.8071 },
  'setúbal': { lat: 38.5244, lng: -8.8882 },
  'setubal': { lat: 38.5244, lng: -8.8882 },
  'viseu': { lat: 40.6566, lng: -7.9125 },
  'viana do castelo': { lat: 41.6918, lng: -8.8344 },
  'évora': { lat: 38.5711, lng: -7.9093 },
  'evora': { lat: 38.5711, lng: -7.9093 },
  'funchal': { lat: 32.6669, lng: -16.9241 },
  'ponta delgada': { lat: 37.7483, lng: -25.6666 },
  'guimarães': { lat: 41.4425, lng: -8.2918 },
  'guimaraes': { lat: 41.4425, lng: -8.2918 },
  'vila nova de gaia': { lat: 41.1239, lng: -8.6118 },
  'gaia': { lat: 41.1239, lng: -8.6118 },
  'matosinhos': { lat: 41.1844, lng: -8.6886 },
  'maia': { lat: 41.2356, lng: -8.6200 },
  'gondomar': { lat: 41.1449, lng: -8.5327 },
  'almada': { lat: 38.6790, lng: -9.1565 },
  'amadora': { lat: 38.7538, lng: -9.2340 },
  'oeiras': { lat: 38.6969, lng: -9.3147 },
  'cascais': { lat: 38.6967, lng: -9.4215 },
  'sintra': { lat: 38.7980, lng: -9.3880 },
  'loures': { lat: 38.8308, lng: -9.1684 },
  'vila franca de xira': { lat: 38.9553, lng: -8.9898 },
  'santarém': { lat: 39.2369, lng: -8.6868 },
  'santarem': { lat: 39.2369, lng: -8.6868 },
  'castelo branco': { lat: 39.8223, lng: -7.4931 },
  'guarda': { lat: 40.5373, lng: -7.2676 },
  'bragança': { lat: 41.8057, lng: -6.7575 },
  'braganca': { lat: 41.8057, lng: -6.7575 },
  'vila real': { lat: 41.2958, lng: -7.7466 },
  'portalegre': { lat: 39.2967, lng: -7.4307 },
  'beja': { lat: 38.0154, lng: -7.8632 },
  // Spain
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'valencia': { lat: 39.4699, lng: -0.3763 },
  'sevilla': { lat: 37.3891, lng: -5.9845 },
  'seville': { lat: 37.3891, lng: -5.9845 },
  'malaga': { lat: 36.7213, lng: -4.4214 },
  'bilbao': { lat: 43.2630, lng: -2.9350 },
  // Other EU
  'paris': { lat: 48.8566, lng: 2.3522 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'londres': { lat: 51.5074, lng: -0.1278 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'berlim': { lat: 52.5200, lng: 13.4050 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'amesterdão': { lat: 52.3676, lng: 4.9041 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'roma': { lat: 41.9028, lng: 12.4964 },
  'brussels': { lat: 50.8503, lng: 4.3517 },
  'bruxelas': { lat: 50.8503, lng: 4.3517 },
  'luxembourg': { lat: 49.6116, lng: 6.1319 },
  'luxemburgo': { lat: 49.6116, lng: 6.1319 },
};

/**
 * Resolve city name to coordinates.
 * First tries local lookup, then falls back to Nominatim (OpenStreetMap) API.
 */
export async function geocodeCity(
  cityName: string
): Promise<{ lat: number; lng: number } | null> {
  const normalized = cityName.trim().toLowerCase();

  // Local lookup
  if (CITY_COORDS[normalized]) {
    return CITY_COORDS[normalized];
  }

  // Partial match — check if any known city starts with or contains the input
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (key.startsWith(normalized) || normalized.startsWith(key)) {
      return coords;
    }
  }

  // Fallback: Nominatim API (free, no key needed, 1 req/sec)
  // 3s timeout to avoid blocking onboarding
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Homie-App/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch {
    // Geocoding failed or timed out, return null
  }

  return null;
}
