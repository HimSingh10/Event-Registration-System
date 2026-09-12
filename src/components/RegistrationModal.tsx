import React, { useState, useEffect } from 'react';
import { EventItem, Registration } from '../types';
import { useApp } from '../context/AppContext';
import { formatDate, formatCurrency, downloadIcsFile, parseErrorMessage } from '../utils/helpers';
import confetti from 'canvas-confetti';
import {
  X,
  Check,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Utensils,
  Shirt,
  FileText,
  Sparkles,
  QrCode,
  Download,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Printer,
  Tag,
  Lock,
  Edit3,
  Loader2,
} from 'lucide-react';

interface RegistrationModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onViewTicket: (reg: Registration) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onViewTicket,
}) => {
  const { currentUser, registerForEvent, registrations, showToast } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 'success'>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedRegistration, setCompletedRegistration] = useState<Registration | null>(null);

  // Form states
  const [fullName, setFullName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [organization, setOrganization] = useState(currentUser.organization || '');
  const [department, setDepartment] = useState(currentUser.department || '');
  const [designation, setDesignation] = useState(currentUser.designation || '');
  const [dietary, setDietary] = useState('Vegetarian');
  const [tshirtSize, setTshirtSize] = useState('L');
  const [notes, setNotes] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLoggedIn = currentUser.id !== 'guest-user' && Boolean(currentUser.email);

  // Sync with current user when opened
  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setOrganization(currentUser.organization || '');
      setDepartment(currentUser.department || '');
      setDesignation(currentUser.designation || '');
      setStep(1);
      setErrorMsg(null);
      setCompletedRegistration(null);
      setAgreeTerms(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !event) return null;

  // Check if already registered
  const existingReg = registrations.find(
    (r) =>
      r.eventId === event.id &&
      r.attendeeEmail.toLowerCase() === email.toLowerCase() &&
      r.ticketStatus !== 'Cancelled'
  );

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!fullName.trim() || !email.trim()) {
        setErrorMsg('Please enter your full name and a valid email address.');
        return;
      }
      if (existingReg) {
        setErrorMsg(`You have already registered for this event with ticket ${existingReg.ticketId || existingReg.id}.`);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
    if (step === 4) setStep(3);
  };

  const handleConfirmRegistration = async () => {
    setErrorMsg(null);
    if (!agreeTerms) {
      setErrorMsg('Please confirm agreement to event terms and admission conditions.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reg = await registerForEvent({
        eventId: event.id,
        attendeeName: fullName.trim(),
        attendeeEmail: email.trim(),
        attendeePhone: phone.trim(),
        organization: organization.trim(),
        department: department.trim(),
        designation: designation.trim(),
        dietaryPreference: dietary,
        customNotes: notes.trim(),
        tshirtSize,
      });

      setCompletedRegistration(reg);
      setStep('success');

      // Celebration Confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if blocked in iframe
      }
      showToast('success', 'Registration Confirmed!', `Ticket ID #${reg.ticketId || reg.id} generated.`);
    } catch (err: any) {
      setErrorMsg(parseErrorMessage(err) || 'Failed to complete registration transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="registration-modal-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Step Progress */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {event.category}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {formatCurrency(event.price, event.currency)}
              </span>
            </div>
            <button
              id="close-registration-modal-btn"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
            {step === 'success' ? 'Registration Confirmed!' : `Register: ${event.title}`}
          </h2>

          {/* Stepper Wizard Bar (shown for steps 1 - 4) */}
          {step !== 'success' && (
            <div className="flex items-center justify-between mt-4 relative">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-0 transition-all duration-300"
                style={{
                  width:
                    step === 1 ? '0%' : step === 2 ? '33%' : step === 3 ? '66%' : '100%',
                }}
              />

              {[
                { num: 1, label: 'Personal' },
                { num: 2, label: 'Details' },
                { num: 3, label: 'Review' },
                { num: 4, label: 'Confirm' },
              ].map((s) => {
                const isPast = typeof step === 'number' && step > s.num;
                const isCurrent = step === s.num;

                return (
                  <div key={s.num} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                        isPast
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950'
                          : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-400'
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium ${
                        isCurrent
                          ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    {formatDate(event.date)} • {event.startTime} - {event.endTime}
                  </span>
                </div>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {event.remainingCapacity} seats left
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="step1-fullname-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Johnson"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address *
                  </label>
                  {isLoggedIn && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Authenticated Account
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="step1-email-input"
                    type="email"
                    required
                    disabled={isLoggedIn}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.johnson@example.com"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 ${
                      isLoggedIn
                        ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ticket ID and digital QR pass will be linked to this address.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="step1-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Additional Information */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    College / Company
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="step2-org-input"
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Stanford / Microsoft"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    id="step2-dept-input"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Computer Science / AI Lab"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="step2-designation-input"
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Student / Engineer"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dietary Preference
                  </label>
                  <select
                    id="step2-dietary-select"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="None">None (Standard Meal)</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Halal">Halal</option>
                    <option value="Kosher">Kosher</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                  </select>
                </div>
              </div>

              {/* T-Shirt size */}
              {(event.category === 'Hackathon' || event.category === 'Workshop' || event.category === 'Sports') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event Swag T-Shirt Size
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {['S', 'M', 'L', 'XL', '2XL'].map((sz) => (
                      <button
                        type="button"
                        key={sz}
                        id={`tshirt-btn-${sz}`}
                        onClick={() => setTshirtSize(sz)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          tshirtSize === sz
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Questions / Special Notes
                </label>
                <textarea
                  id="step2-notes-textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Accessibility needs, group/team name, or special requirements..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Review Your Information
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Info</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Attendee Name</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{fullName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Email</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate block">
                      {email}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Phone</span>
                    <span className="font-semibold">{phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Organization</span>
                    <span className="font-semibold">{organization || 'Independent'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Department</span>
                    <span className="font-semibold">{department || 'General'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Designation</span>
                    <span className="font-semibold">{designation || 'Delegate'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Dietary</span>
                    <span className="font-semibold">{dietary}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">T-Shirt Size</span>
                    <span className="font-semibold">{tshirtSize}</span>
                  </div>
                  {notes && (
                    <div className="col-span-2">
                      <span className="block text-[10px] text-slate-400 uppercase">Notes</span>
                      <span className="font-normal text-slate-700 dark:text-slate-300">{notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Please double-check your attendee details. Click Continue to view the final confirmation.
              </p>
            </div>
          )}

          {/* STEP 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Admission Order
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {event.title}
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs">
                    {formatCurrency(event.price, event.currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Event</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate block">
                      {event.title}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Attendee</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{fullName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Date & Time</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatDate(event.date)} ({event.startTime})
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Ticket Type</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      Standard Delegate Pass
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-slate-400 uppercase">Venue</span>
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{event.venue} ({event.locationType})</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Total Payable</span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {formatCurrency(event.price, event.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Seat Status</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {event.remainingCapacity} seats remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Agreement checkbox */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    id="agree-terms-checkbox"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    I confirm that the attendee details are accurate and agree to the event code of
                    conduct, venue admission terms, and ticket verification policies.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {step === 'success' && completedRegistration && (
            <div className="space-y-4 animate-in zoom-in-95 duration-300 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Registration Confirmed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Your seat has been reserved in Firestore. Present this ticket and QR code at venue check-in.
                </p>
              </div>

              {/* Digital Pass Preview Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 max-w-sm mx-auto text-left shadow-md relative overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      Confirmed Entry Pass
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {event.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      Attendee: {completedRegistration.attendeeName}
                    </p>
                    <div className="pt-1 text-[10px] font-mono space-y-0.5">
                      <p className="text-slate-500 dark:text-slate-400">
                        Reg ID: <span className="font-bold text-slate-800 dark:text-slate-200">{completedRegistration.id}</span>
                      </p>
                      <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                        Ticket ID: {completedRegistration.ticketId || completedRegistration.id}
                      </p>
                    </div>
                  </div>

                  {completedRegistration.qrCodeDataUrl && (
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs shrink-0 text-center">
                      <img
                        src={completedRegistration.qrCodeDataUrl}
                        alt="QR Ticket"
                        className="w-20 h-20 object-contain"
                      />
                      <span className="text-[9px] font-mono text-slate-400 block mt-0.5">Gate QR</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Three Specific Buttons Requested */}
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  id="view-my-ticket-btn"
                  onClick={() => {
                    onViewTicket(completedRegistration);
                    onClose();
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>View My Ticket</span>
                </button>

                <button
                  id="print-ticket-btn"
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-indigo-500" />
                  <span>Print Ticket</span>
                </button>

                <button
                  id="back-to-events-btn"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Back to Events</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons (for steps 1 - 4) */}
        {step !== 'success' && (
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            {step > 1 ? (
              <button
                id="reg-prev-btn"
                type="button"
                onClick={handlePrevStep}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 && (
              <button
                id="reg-next-btn"
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                id="reg-confirm-btn"
                type="button"
                disabled={isSubmitting || !agreeTerms}
                onClick={handleConfirmRegistration}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Allocating Seat in Database...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Confirm Registration</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
