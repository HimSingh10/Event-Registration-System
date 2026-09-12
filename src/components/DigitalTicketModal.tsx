import React, { useRef } from 'react';
import { Registration, EventItem } from '../types';
import { useApp } from '../context/AppContext';
import { formatDate, downloadIcsFile } from '../utils/helpers';
import { SvgBarcode } from './SvgBarcode';
import {
  X,
  Printer,
  Calendar,
  MapPin,
  User,
  Mail,
  ShieldCheck,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  Building,
} from 'lucide-react';

interface DigitalTicketModalProps {
  registration: Registration | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalTicketModal: React.FC<DigitalTicketModalProps> = ({
  registration,
  isOpen,
  onClose,
}) => {
  const { events, showToast } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !registration) return null;

  const event = events.find((e) => e.id === registration.eventId);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Ticket for ${registration.eventTitle}`,
          text: `My ticket #${registration.id} for ${registration.eventTitle}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `EventEase Ticket: ${registration.eventTitle} | Attendee: ${registration.attendeeName} | ID: ${registration.id}`
      );
      showToast('info', 'Ticket Details Copied', 'Copied ticket information to clipboard.');
    }
  };

  const isCheckedIn = registration.ticketStatus === 'Checked In';
  const isCancelled = registration.ticketStatus === 'Cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="digital-ticket-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top action bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-['Space_Grotesk']">
              Official Digital Entry Pass
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="ticket-share-btn"
              onClick={handleShare}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
              title="Share ticket"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              id="ticket-print-btn"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              id="ticket-close-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Canvas */}
        <div className="p-6 overflow-y-auto print:p-0">
          <div
            ref={printRef}
            id="ticket-printable-card"
            className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl border border-slate-700/60 shadow-xl overflow-hidden relative"
          >
            {/* Top Event Banner Section */}
            <div className="relative h-44 overflow-hidden">
              <img
                src={registration.eventBanner}
                alt={registration.eventTitle}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

              {/* Status Ribbon */}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-md flex items-center gap-1.5 backdrop-blur-md ${
                    isCheckedIn
                      ? 'bg-emerald-500 text-white'
                      : isCancelled
                      ? 'bg-rose-500 text-white'
                      : 'bg-indigo-500 text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{registration.ticketStatus}</span>
                </span>
              </div>

              {/* Brand watermark */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur-md border border-slate-700/50">
                <span className="text-xs font-extrabold tracking-tight font-['Space_Grotesk'] text-white">
                  Event<span className="text-indigo-400">Ease</span>
                </span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider">Pass</span>
              </div>

              {/* Event Title inside banner bottom */}
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                  {registration.eventTitle}
                </h3>
              </div>
            </div>

            {/* Perforated Divider with Cutout notches */}
            <div className="relative py-2 flex items-center">
              <div className="absolute -left-3 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-r border-slate-700/60" />
              <div className="w-full border-t-2 border-dashed border-slate-700 mx-4" />
              <div className="absolute -right-3 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-l border-slate-700/60" />
            </div>

            {/* Ticket Information Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                    Attendee
                  </span>
                  <p className="font-bold text-sm text-white">{registration.attendeeName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{registration.attendeeEmail}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                    Pass & Ticket ID
                  </span>
                  <p className="font-mono font-extrabold text-sm text-indigo-400">
                    {registration.id}
                  </p>
                  <p className="font-mono text-xs text-emerald-400 font-bold">
                    {registration.ticketId || registration.id}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Booked: {new Date(registration.registeredAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                    Date & Time
                  </span>
                  <p className="font-semibold text-slate-200">
                    {formatDate(registration.eventDate)}
                  </p>
                  <p className="text-[11px] text-slate-400">{registration.eventTime}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                    Organization / Dept
                  </span>
                  <p className="font-semibold text-slate-200 truncate">
                    {registration.organization || 'Independent'}
                  </p>
                  {registration.department && (
                    <p className="text-[11px] text-slate-400 truncate">{registration.department}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                    Venue
                  </span>
                  <p className="font-semibold text-slate-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{registration.eventVenue}</span>
                  </p>
                </div>
              </div>

              {/* QR Code & Scan Instructions Box */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                <div className="text-center sm:text-left space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1 justify-center sm:justify-start">
                    <Sparkles className="w-3 h-3" />
                    <span>Instant Entry QR</span>
                  </span>
                  <p className="text-xs text-slate-300">
                    Show this code at check-in station or kiosk.
                  </p>
                  {isCheckedIn && (
                    <p className="text-[11px] text-emerald-400 font-medium">
                      ✓ Checked in at {new Date(registration.checkedInAt || '').toLocaleTimeString()} by{' '}
                      {registration.checkedInBy || 'Staff'}
                    </p>
                  )}
                </div>

                {registration.qrCodeDataUrl ? (
                  <div className="bg-white p-2 rounded-2xl shadow-lg shrink-0">
                    <img
                      src={registration.qrCodeDataUrl}
                      alt={`QR Code ${registration.id}`}
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 bg-white/10 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                    QR Code
                  </div>
                )}
              </div>

              {/* SVG Barcode Verification Section */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col items-center justify-center bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60 text-center">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 flex items-center gap-1">
                  <span>Standard Machine-Readable Barcode</span>
                </span>
                <SvgBarcode
                  value={registration.ticketId || registration.id}
                  height={54}
                  width={280}
                  className="text-white max-w-full"
                  showText={true}
                />
              </div>

              {/* Ticket Footer details */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2">
                <span>Non-transferable • EventEase Verified</span>
                <span>Powered by EventEase Platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between print:hidden">
          {event && (
            <button
              onClick={() => downloadIcsFile(event)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Add to Calendar (.ics)</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors ml-auto cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
