import QRCode from 'qrcode';
import { EventItem, Registration, DynamicEventStatus } from '../types';

/**
 * Generate QR Code data URL asynchronously
 */
export async function generateQrCodeUrl(data: string): Promise<string> {
  try {
    const url = await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    return url;
  } catch (err) {
    console.error('Failed to generate QR code', err);
    // Fallback simple SVG data URI
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230f172a"/><text x="100" y="105" fill="white" font-size="12" text-anchor="middle" font-family="sans-serif">QR CODE: ${encodeURIComponent(data)}</text></svg>`;
  }
}

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  '₹': 'INR',
  inr: 'INR',
  rs: 'INR',
  'rs.': 'INR',
  $: 'USD',
  usd: 'USD',
  '€': 'EUR',
  eur: 'EUR',
  '£': 'GBP',
  gbp: 'GBP',
  '¥': 'JPY',
  jpy: 'JPY',
  cny: 'CNY',
  cad: 'CAD',
  aud: 'AUD',
};

const CURRENCY_LOCALE_MAP: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
};

/**
 * Format currency safely handling symbols like ₹, $, €, and ISO codes
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (amount === 0) return 'Free';
  const rawCurrency = (currency || 'USD').trim();
  const isoCode =
    CURRENCY_SYMBOL_MAP[rawCurrency] ||
    CURRENCY_SYMBOL_MAP[rawCurrency.toLowerCase()] ||
    rawCurrency.toUpperCase();

  try {
    const locale = CURRENCY_LOCALE_MAP[isoCode] || 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: isoCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // If Intl.NumberFormat fails for any reason, provide safe symbol fallback
    const symbol = rawCurrency.length <= 3 ? rawCurrency : '';
    return symbol ? `${symbol}${amount.toLocaleString()}` : `${amount.toLocaleString()} ${rawCurrency}`;
  }
}

/**
 * Format date string e.g. "Thu, Sep 24, 2026"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Export participant list to CSV
 */
export function exportParticipantsToCsv(event: EventItem, registrations: Registration[]) {
  const headers = [
    'Registration ID',
    'Attendee Name',
    'Email',
    'Phone',
    'Organization',
    'Department',
    'Designation',
    'Dietary Preference',
    'T-Shirt Size',
    'Ticket Status',
    'Registered Date',
    'Checked In At',
  ];

  const rows = registrations.map((r) => [
    `"${r.id}"`,
    `"${r.attendeeName.replace(/"/g, '""')}"`,
    `"${r.attendeeEmail}"`,
    `"${r.attendeePhone || ''}"`,
    `"${(r.organization || '').replace(/"/g, '""')}"`,
    `"${(r.department || '').replace(/"/g, '""')}"`,
    `"${(r.designation || '').replace(/"/g, '""')}"`,
    `"${r.dietaryPreference || 'None'}"`,
    `"${r.tshirtSize || 'N/A'}"`,
    `"${r.ticketStatus}"`,
    `"${new Date(r.registeredAt).toLocaleString()}"`,
    `"${r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : 'Not Checked In'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Attendees.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate and download .ics Calendar file
 */
export function downloadIcsFile(event: EventItem) {
  const [year, month, day] = event.date.split('-');
  const [startH, startM] = (event.startTime || '09:00').split(':');
  const [endH, endM] = (event.endTime || '17:00').split(':');

  const dtStart = `${year}${month}${day}T${startH}${startM}00`;
  const dtEnd = `${year}${month}${day}T${endH}${endM}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventEase//Event Registration System//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@eventease.io`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${event.description.slice(0, 250).replace(/,/g, '\\,')}`,
    `LOCATION:${event.venue.replace(/,/g, '\\,')} - ${event.address.replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generic CSV Exporter
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const formatCell = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
  const csvContent = [
    headers.map(formatCell).join(','),
    ...rows.map((row) => row.map(formatCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate human-readable registration ID (e.g., EVT-7F3K92)
 */
export function generateRegistrationId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EVT-${code}`;
}

/**
 * Generate secure unique ticket ID (e.g., TCK-9A2K7L-8402)
 */
export function generateTicketId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 6; i++) p1 += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 4; i++) p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  return `TCK-${p1}-${p2}`;
}

/**
 * Approximate Distance using Haversine formula
 * Returns distance in kilometers (rounded to 1 decimal place)
 */
export function calculateDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | null {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return null;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10;
}

/**
 * Format distance cleanly e.g., "4.2 km away" or "850 m away"
 */
export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined || isNaN(km)) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
}

/**
 * Popular Cities with coordinates for distance and manual selection
 */
export interface CityLocation {
  name: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const POPULAR_CITIES: CityLocation[] = [
  { name: 'New Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Bengaluru', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867 },
  { name: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567 },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714 },
  { name: 'San Francisco', state: 'California', country: 'USA', latitude: 37.7749, longitude: -122.4194 },
  { name: 'New York', state: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.0060 },
  { name: 'London', state: 'England', country: 'UK', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050 },
];

/**
 * Calculate dynamic event status from current time and database values
 * Never hardcodes status.
 */
export function getDynamicEventStatus(event: EventItem, now: Date = new Date()): DynamicEventStatus {
  // 1. Explicit admin/organizer overrides
  const rawStatus = (event.status || '').toUpperCase().trim();
  if (rawStatus === 'CANCELLED' || rawStatus === 'CANCEL') return 'CANCELLED';
  if (rawStatus === 'DRAFT') return 'DRAFT';
  if (rawStatus === 'PENDING_APPROVAL' || rawStatus === 'PENDING APPROVAL') return 'PENDING_APPROVAL';

  const nowMs = now.getTime();

  // 2. Parse start and end timestamps
  let startMs: number;
  if (event.startAt) {
    startMs = new Date(event.startAt).getTime();
  } else if (event.date) {
    const timeStr = event.startTime || '09:00';
    startMs = new Date(`${event.date}T${timeStr}:00`).getTime();
  } else {
    startMs = nowMs;
  }

  let endMs: number;
  if (event.endAt) {
    endMs = new Date(event.endAt).getTime();
  } else if (event.date) {
    const timeStr = event.endTime || '18:00';
    endMs = new Date(`${event.date}T${timeStr}:00`).getTime();
  } else {
    endMs = startMs + 4 * 60 * 60 * 1000;
  }

  // 3. Has event concluded?
  if (nowMs > endMs) {
    return 'COMPLETED';
  }

  // 4. Is event currently live?
  if (nowMs >= startMs && nowMs <= endMs) {
    return 'LIVE';
  }

  // 5. Check capacity / sold out
  const capacity = event.capacity ?? event.maxCapacity ?? 0;
  if (capacity > 0 && event.registeredCount >= capacity) {
    return 'SOLD_OUT';
  }

  // 6. Registration window checks
  let regStartMs = 0;
  if (event.registrationStart) {
    regStartMs = new Date(event.registrationStart).getTime();
  }

  let regEndMs = startMs;
  if (event.registrationEnd) {
    regEndMs = new Date(event.registrationEnd).getTime();
  } else if (event.registrationDeadline) {
    regEndMs = new Date(`${event.registrationDeadline}T23:59:59`).getTime();
  }

  if (regStartMs > 0 && nowMs < regStartMs) {
    return 'REGISTRATION_NOT_OPEN';
  }

  if (nowMs > regEndMs) {
    // If registration has closed, check if event starts within 24h
    if (startMs - nowMs > 0 && startMs - nowMs <= 24 * 60 * 60 * 1000) {
      return 'STARTING_SOON';
    }
    return 'REGISTRATION_NOT_OPEN';
  }

  // 7. Starting soon check (within 24 hours before event starts)
  if (startMs - nowMs > 0 && startMs - nowMs <= 24 * 60 * 60 * 1000) {
    return 'STARTING_SOON';
  }

  // 8. Normal open registration
  return 'REGISTRATION_OPEN';
}

/**
 * Badging and styling configuration for dynamic status
 */
export function getStatusBadgeConfig(status: DynamicEventStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
  pulse?: boolean;
} {
  switch (status) {
    case 'LIVE':
      return {
        label: 'Live Now',
        badgeClass: 'bg-rose-950/90 text-rose-200 border border-rose-500/40',
        dotClass: 'bg-rose-500',
        pulse: true,
      };
    case 'STARTING_SOON':
      return {
        label: 'Starting Soon',
        badgeClass: 'bg-amber-950/90 text-amber-200 border border-amber-500/40',
        dotClass: 'bg-amber-400',
        pulse: true,
      };
    case 'REGISTRATION_OPEN':
      return {
        label: 'Registration Open',
        badgeClass: 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/40',
        dotClass: 'bg-emerald-400',
        pulse: false,
      };
    case 'SOLD_OUT':
      return {
        label: 'Sold Out',
        badgeClass: 'bg-slate-900/90 text-rose-300 border border-rose-500/30',
        dotClass: 'bg-rose-400',
        pulse: false,
      };
    case 'REGISTRATION_NOT_OPEN':
      return {
        label: 'Registration Closed',
        badgeClass: 'bg-slate-900/90 text-slate-300 border border-slate-700',
        dotClass: 'bg-slate-400',
        pulse: false,
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        badgeClass: 'bg-slate-900/90 text-slate-400 border border-slate-700',
        dotClass: 'bg-slate-500',
        pulse: false,
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-rose-950/90 text-rose-300 border border-rose-800',
        dotClass: 'bg-rose-600',
        pulse: false,
      };
    case 'DRAFT':
      return {
        label: 'Draft',
        badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700',
        dotClass: 'bg-slate-500',
      };
    case 'PENDING_APPROVAL':
      return {
        label: 'Pending Approval',
        badgeClass: 'bg-purple-950/90 text-purple-200 border border-purple-600/40',
        dotClass: 'bg-purple-400',
        pulse: true,
      };
    case 'PUBLISHED':
      return {
        label: 'Published',
        badgeClass: 'bg-indigo-950/90 text-indigo-200 border border-indigo-500/40',
        dotClass: 'bg-indigo-400',
      };
    default:
      return {
        label: 'Registration Open',
        badgeClass: 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/40',
        dotClass: 'bg-emerald-400',
      };
  }
}

/**
 * Generate cryptographic-like verifiable digital ticket QR payload
 */
export function generateTicketVerificationPayload(
  ticketId: string,
  eventId: string,
  attendeeId: string,
  issuedAt: string
): string {
  let hashVal = 0;
  const raw = `${ticketId}:${eventId}:${attendeeId}:${issuedAt}:eventease`;
  for (let i = 0; i < raw.length; i++) {
    hashVal = ((hashVal << 5) - hashVal + raw.charCodeAt(i)) | 0;
  }
  const signature = Math.abs(hashVal).toString(16).padStart(8, '0').toUpperCase();

  return JSON.stringify({
    ticketId,
    eventId,
    attendeeId,
    issuedAt,
    sig: `EE-${signature}`,
  });
}

/**
 * Extract human-readable error message from errors or FirestoreErrorInfo JSON
 */
export function parseErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.error === 'string') {
      return parsed.error;
    }
  } catch {
    // raw string
  }
  return raw;
}


