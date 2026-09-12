import React, { useState } from 'react';
import { EventItem, EventCategory } from '../types';
import { useApp } from '../context/AppContext';
import { parseErrorMessage } from '../utils/helpers';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: EventItem | null;
}

const CATEGORIES: EventCategory[] = [
  'Technology',
  'Hackathon',
  'Business',
  'Workshop',
  'Sports',
  'Cultural',
  'Education',
  'Music',
];

const PRESET_BANNERS = [
  {
    name: 'Tech & AI',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Hackathon',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Executive Summit',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Workshop & Design',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gala & Cultural',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
  },
];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
}) => {
  const { addEvent, updateEvent, currentUser, showToast } = useApp();

  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [description, setDescription] = useState(eventToEdit?.description || '');
  const [category, setCategory] = useState<EventCategory>(eventToEdit?.category || 'Technology');
  const [date, setDate] = useState(eventToEdit?.date || '2026-10-15');
  const [startTime, setStartTime] = useState(eventToEdit?.startTime || '09:00 AM');
  const [endTime, setEndTime] = useState(eventToEdit?.endTime || '05:00 PM');
  const [registrationDeadline, setRegistrationDeadline] = useState(
    eventToEdit?.registrationDeadline || '2026-10-10'
  );
  const [venue, setVenue] = useState(eventToEdit?.venue || '');
  const [address, setAddress] = useState(eventToEdit?.address || '');
  const [locationType, setLocationType] = useState<'In-Person' | 'Virtual' | 'Hybrid'>(
    eventToEdit?.locationType || 'In-Person'
  );
  const [maxCapacity, setMaxCapacity] = useState(eventToEdit?.maxCapacity || 100);
  const [ticketType, setTicketType] = useState<'Free' | 'Paid'>(eventToEdit?.ticketType || 'Free');
  const [price, setPrice] = useState(eventToEdit?.price || 0);
  const [bannerImage, setBannerImage] = useState(
    eventToEdit?.bannerImage || PRESET_BANNERS[0].url
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple agenda items list
  const [agendaItems, setAgendaItems] = useState<{ time: string; title: string; speaker?: string }[]>(
    eventToEdit?.agenda || [
      { time: '09:00 AM - 10:00 AM', title: 'Welcome Keynote & Opening Address' },
      { time: '10:15 AM - 12:00 PM', title: 'Main Technical Workshop & Interactive Lab' },
    ]
  );

  if (!isOpen) return null;

  const handleAddAgenda = () => {
    setAgendaItems([...agendaItems, { time: '01:00 PM - 02:00 PM', title: 'Panel Discussion' }]);
  };

  const handleRemoveAgenda = (idx: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (publishStatus: 'Published' | 'Draft') => {
    if (!title.trim() || !venue.trim() || !description.trim()) {
      showToast('error', 'Missing Information', 'Please fill in the title, venue, and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (eventToEdit) {
        await updateEvent(eventToEdit.id, {
          title,
          description,
          category,
          date,
          startTime,
          endTime,
          registrationDeadline,
          venue,
          address,
          locationType,
          maxCapacity: Number(maxCapacity),
          ticketType,
          price: ticketType === 'Free' ? 0 : Number(price),
          bannerImage,
          agenda: agendaItems,
        });
      } else {
        await addEvent({
          title,
          description,
          category,
          date,
          startTime,
          endTime,
          registrationDeadline,
          venue,
          address,
          locationType,
          maxCapacity: Number(maxCapacity),
          registeredCount: 0,
          ticketType,
          price: ticketType === 'Free' ? 0 : Number(price),
          currency: 'USD',
          bannerImage,
          status: publishStatus === 'Draft' ? 'Registration Closed' : 'Registration Open',
          organizerId: currentUser.id,
          organizerName: currentUser.name,
          organizerEmail: currentUser.email,
          organizerAvatar: currentUser.avatar,
          agenda: agendaItems,
          speakers: [
            {
              id: 'spk-1',
              name: currentUser.name,
              role: currentUser.designation || 'Lead Organizer',
              company: currentUser.organization || 'EventEase Host',
              avatar: currentUser.avatar,
            },
          ],
          faqs: [
            {
              question: 'What is the check-in procedure?',
              answer: 'Present the digital QR code on your mobile phone upon arrival.',
            },
          ],
          terms: [
            'Attendee badges must be worn at all times within the venue.',
            'EventEase code of conduct strictly enforced.',
          ],
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving event:', err);
      showToast('error', 'Save Failed', parseErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="create-event-modal"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {eventToEdit ? 'Edit Event Details' : 'Create New Event'}
            </h2>
            <p className="text-xs text-slate-500">
              Set schedule, venue, capacity, and admission details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Event Title *
              </label>
              <input
                id="create-event-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NextGen Web & Cloud Architecture Summit 2026"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select
                id="create-event-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Event Description & Overview *
            </label>
            <textarea
              id="create-event-description-textarea"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the theme, target audience, key takeaways, and networking opportunities..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Event Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Start Time</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="09:00 AM"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">End Time</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="05:00 PM"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Reg. Deadline</label>
              <input
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Venue & Location Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Venue / Platform *</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. San Francisco Tech Center / Zoom"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Address / City</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 742 Market St, San Francisco, CA"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Format</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="In-Person">In-Person</option>
                <option value="Virtual">Virtual</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Capacity, Ticket Type & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Max Capacity (Seats)
              </label>
              <input
                type="number"
                min={1}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Ticket Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTicketType('Free');
                    setPrice(0);
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                    ticketType === 'Free'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Free Pass
                </button>
                <button
                  type="button"
                  onClick={() => setTicketType('Paid')}
                  className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                    ticketType === 'Paid'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Paid Ticket
                </button>
              </div>
            </div>

            {ticketType === 'Paid' ? (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Price (USD $)
                </label>
                <input
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            ) : (
              <div className="flex items-center text-slate-400 text-xs italic pt-4">
                Complimentary admission for registered attendees.
              </div>
            )}
          </div>

          {/* Banner presets */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Banner Image Presets or Custom URL
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PRESET_BANNERS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setBannerImage(preset.url)}
                  className={`p-1 rounded-xl border overflow-hidden relative text-left group transition-all ${
                    bannerImage === preset.url
                      ? 'ring-2 ring-indigo-500 border-transparent'
                      : 'border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-12 object-cover rounded-lg"
                  />
                  <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block truncate mt-1 px-0.5">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
            <input
              type="url"
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              placeholder="Or paste custom image URL..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>

          {/* Agenda Builder */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Agenda Sessions ({agendaItems.length})
              </label>
              <button
                type="button"
                onClick={handleAddAgenda}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Session</span>
              </button>
            </div>

            <div className="space-y-2">
              {agendaItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <input
                    type="text"
                    value={item.time}
                    onChange={(e) => {
                      const updated = [...agendaItems];
                      updated[idx].time = e.target.value;
                      setAgendaItems(updated);
                    }}
                    placeholder="Time range"
                    className="w-1/3 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const updated = [...agendaItems];
                      updated[idx].title = e.target.value;
                      setAgendaItems(updated);
                    }}
                    placeholder="Session title"
                    className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAgenda(idx)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('Draft')}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save as Closed/Draft'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('Published')}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Publishing...' : eventToEdit ? 'Save Changes' : 'Publish Event'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
