export type UserRole = 'Attendee' | 'Organizer' | 'Admin' | 'attendee' | 'organizer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  organization?: string;
  department?: string;
  designation?: string;
  avatar: string;
  status: 'active' | 'inactive';
  createdAt: string;
  interests?: EventCategory[];
  preferredCity?: string;
  radiusKm?: number;
}

export type EventCategory =
  | 'Technology'
  | 'Business'
  | 'Workshop'
  | 'Sports'
  | 'Cultural'
  | 'Education'
  | 'Hackathon'
  | 'Music';

export type DynamicEventStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'REGISTRATION_NOT_OPEN'
  | 'REGISTRATION_OPEN'
  | 'SOLD_OUT'
  | 'STARTING_SOON'
  | 'LIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type EventStatus =
  | 'Registration Open'
  | 'Almost Full'
  | 'Registration Closed'
  | 'Completed'
  | 'Cancelled'
  | DynamicEventStatus;

export interface Speaker {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  bio?: string;
}

export interface AgendaItem {
  time: string;
  title: string;
  speaker?: string;
  description?: string;
}

export interface EventFAQ {
  question: string;
  answer: string;
}

export interface EventItem {
  id: string;
  eventId?: string; // alias of id
  title: string;
  description: string;
  bannerImage: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  startAt?: string; // ISO 8601 or epoch string
  endAt?: string; // ISO 8601 or epoch string
  registrationStart?: string; // ISO 8601 string
  registrationEnd?: string; // ISO 8601 string
  venue: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  format?: 'In-Person' | 'Virtual' | 'Hybrid';
  locationType: 'In-Person' | 'Virtual' | 'Hybrid';
  virtualMeetingUrl?: string;
  virtualMeetingNotes?: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar: string;
  organizerEmail: string;
  capacity?: number; // alias of maxCapacity
  maxCapacity: number;
  registeredCount: number;
  checkedInCount: number;
  registrationDeadline: string; // YYYY-MM-DD
  eventType: 'Conference' | 'Workshop' | 'Hackathon' | 'Competition' | 'Seminar' | 'Concert' | 'Exhibition' | 'Festival';
  ticketType: 'Free' | 'Paid';
  price: number;
  currency: string;
  status: EventStatus;
  speakers: Speaker[];
  agenda: AgendaItem[];
  faqs: EventFAQ[];
  terms: string[];
  featured?: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Registration {
  id: string; // e.g. "EVT-7F3K92"
  ticketId?: string; // e.g. "TCK-8H2K91-4M22"
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventBanner: string;
  userId: string;
  attendeeId?: string; // synonym of userId
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  organization?: string;
  department?: string;
  designation?: string;
  dietaryPreference?: string;
  customNotes?: string;
  tshirtSize?: string;
  customResponses?: Record<string, any>;
  qrCodeDataUrl: string;
  status?: 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN';
  ticketStatus: 'Confirmed' | 'Checked In' | 'Cancelled';
  paymentStatus?: 'NOT_REQUIRED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  registeredAt: string;
  updatedAt?: string;
  checkedInAt?: string;
  checkedInBy?: string;
  ticketPrice: number;
  isDemo?: boolean;
}

export interface CheckInRecord {
  id: string;
  ticketId: string;
  registrationId: string;
  eventId: string;
  attendeeId: string;
  checkedInBy: string;
  checkedInAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'registration' | 'reminder' | 'announcement' | 'update' | 'checkin';
  read: boolean;
  createdAt: string;
  eventId?: string;
}

export interface EventFeedback {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number; // 1-5
  review: string;
  suggestions?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details: string;
  eventId?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  eventId: string;
  createdAt: string;
}

export interface UserLocationState {
  city: string;
  latitude: number | null;
  longitude: number | null;
  permissionStatus: 'prompt' | 'granted' | 'denied';
  isDetecting: boolean;
  radiusKm: number;
}

export interface AiRecommendedEventItem {
  eventId: string;
  reason?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendedEventIds?: string[];
  recommendedEvents?: AiRecommendedEventItem[];
  suggestions?: string[];
}

export interface AiRecommendationResult {
  eventId: string;
  matchScore: number;
  reason: string;
  highlightTag: string;
}

export interface AiOrganizerToolResult {
  title?: string;
  description?: string;
  agenda?: AgendaItem[];
  faqs?: EventFAQ[];
  highlights?: string[];
}

