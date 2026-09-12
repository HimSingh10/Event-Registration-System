/**
 * Location, Geolocation, Distance Calculation, and External Map Utilities
 * for EventEase - Privacy-first & Zero API Key Exposure
 */

export interface CityLocation {
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const SUPPORTED_CITIES: CityLocation[] = [
  { name: 'San Francisco', region: 'CA', country: 'United States', latitude: 37.7749, longitude: -122.4194 },
  { name: 'New Delhi', region: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Bengaluru', region: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Mumbai', region: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Stanford', region: 'CA', country: 'United States', latitude: 37.4275, longitude: -122.1697 },
  { name: 'New York', region: 'NY', country: 'United States', latitude: 40.7128, longitude: -74.0060 },
  { name: 'Austin', region: 'TX', country: 'United States', latitude: 30.2672, longitude: -97.7431 },
  { name: 'London', region: 'England', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Berlin', region: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050 },
  { name: 'Tokyo', region: 'Kanto', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Singapore', region: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
];

/**
 * Calculate distance in kilometers between two coordinates using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Format distance into a friendly human-readable string (e.g. "2.4 km away")
 */
export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm == null || isNaN(distanceKm)) return '';
  if (distanceKm < 0.5) return 'Within 500m';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m away`;
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Find closest city from list for approximate matching
 */
export function findClosestCity(lat: number, lon: number): CityLocation {
  let closest = SUPPORTED_CITIES[0];
  let minDistance = Infinity;

  for (const city of SUPPORTED_CITIES) {
    const dist = calculateDistanceKm(lat, lon, city.latitude, city.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  return closest;
}

/**
 * Generate safe external Google Maps Directions URL
 */
export function getGoogleMapsDirectionsUrl(
  venue: string,
  address: string,
  city?: string
): string {
  const query = [venue, address, city].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

/**
 * Generate safe external Google Maps Place Search URL
 */
export function getGoogleMapsSearchUrl(
  venue: string,
  address: string,
  city?: string
): string {
  const query = [venue, address, city].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Determine event urgency tags (e.g. "Only 5 seats left", "Almost Full")
 */
export function getEventUrgencyBadge(event: {
  maxCapacity: number;
  registeredCount: number;
  registrationDeadline?: string;
  status?: string;
}): { text: string; tone: 'danger' | 'warning' | 'info' } | null {
  const remainingSeats = Math.max(0, event.maxCapacity - event.registeredCount);

  if (remainingSeats === 0 || event.status === 'SOLD_OUT' || event.status === 'Registration Closed') {
    return { text: 'Sold Out', tone: 'danger' };
  }

  if (remainingSeats <= 5) {
    return { text: `Only ${remainingSeats} seat${remainingSeats === 1 ? '' : 's'} left`, tone: 'danger' };
  }

  const occupancyRatio = event.registeredCount / event.maxCapacity;
  if (occupancyRatio >= 0.85) {
    return { text: 'Almost Full', tone: 'warning' };
  }

  if (event.registrationDeadline) {
    try {
      const now = new Date().getTime();
      const deadline = new Date(event.registrationDeadline).getTime();
      const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= 2) {
        return { text: diffDays === 1 ? 'Closing Tomorrow' : `Closes in ${diffDays} days`, tone: 'warning' };
      }
    } catch {
      // ignore date parse issues
    }
  }

  return null;
}
