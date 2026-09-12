import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Registration, EventItem } from '../types';
import { formatDate } from '../utils/helpers';
import jsQR from 'jsqr';
import {
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Users,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  Zap,
  ShieldAlert,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const QRCheckIn: React.FC = () => {
  const {
    events,
    registrations,
    checkInAttendee,
    currentUser,
    role,
    showToast,
  } = useApp();

  // Select event to check in for (default to first active event)
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return events[0]?.id || '';
  });

  const [inputRegId, setInputRegId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastCheckInResult, setLastCheckInResult] = useState<{
    status: 'idle' | 'success' | 'duplicate' | 'error';
    message: string;
    registration?: Registration;
  }>({
    status: 'idle',
    message: '',
  });

  // Camera scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const eventRegistrations = registrations.filter(
    (r) => r.eventId === selectedEvent?.id && r.ticketStatus !== 'Cancelled'
  );
  const checkedInCount = eventRegistrations.filter((r) => r.ticketStatus === 'Checked In').length;
  const attendanceRate =
    eventRegistrations.length > 0
      ? Math.round((checkedInCount / eventRegistrations.length) * 100)
      : 0;

  const performCheckIn = useCallback(
    async (ticketIdOrPayload: string) => {
      const cleanInput = ticketIdOrPayload.trim();
      if (!cleanInput) return;

      setIsVerifying(true);
      try {
        const res = await checkInAttendee(
          cleanInput,
          selectedEvent?.id,
          currentUser.name || 'Gate Officer'
        );

        if (res.success) {
          setLastCheckInResult({
            status: 'success',
            message: res.message,
            registration: res.registration,
          });
          showToast('success', '✓ Check-in Verified', res.message);
        } else if (res.status === 'duplicate') {
          setLastCheckInResult({
            status: 'duplicate',
            message: res.message,
            registration: res.registration,
          });
          showToast('warning', '⚠ Already Checked In', res.message);
        } else {
          setLastCheckInResult({
            status: 'error',
            message: res.message,
            registration: res.registration,
          });
          showToast('error', '✕ Check-in Rejected', res.message);
        }
      } catch (err: any) {
        setLastCheckInResult({
          status: 'error',
          message: err.message || 'Verification failed.',
        });
        showToast('error', 'Verification Error', err.message);
      } finally {
        setIsVerifying(false);
      }
    },
    [checkInAttendee, selectedEvent, currentUser.name, showToast]
  );

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Frame scanning loop when camera is active
  useEffect(() => {
    if (!isCameraActive) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    const scanFrame = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            const now = Date.now();
            // Prevent spamming check-in if same code is in camera view
            if (now - lastScannedTimeRef.current > 3000) {
              lastScannedTimeRef.current = now;
              performCheckIn(code.data);
            }
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isCameraActive, performCheckIn]);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('error', 'Camera Not Supported', 'Your browser does not support camera capture.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      showToast('info', 'Scanner Active', 'Point your camera at the attendee QR ticket.');
    } catch (err: any) {
      console.error('Camera error', err);
      showToast(
        'warning',
        'Camera Permission Blocked',
        'Using manual ID verification and quick-scan simulation below.'
      );
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRegId.trim()) return;

    performCheckIn(inputRegId.trim());
    setInputRegId('');
  };

  return (
    <div id="qr-checkin-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <QrCode className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
              Live QR Check-In Station
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time attendance verification, camera QR scanner, and attendee management.
          </p>
        </div>

        {/* Event Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Select Event:
          </label>
          <select
            id="checkin-event-select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setLastCheckInResult({ status: 'idle', message: '' });
            }}
            className="px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-indigo-500"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.date})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Attendance Statistics Bar */}
      {selectedEvent && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Total Registered
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {eventRegistrations.length}
              </span>
              <span className="text-xs text-slate-500">
                / {selectedEvent.maxCapacity} Max Capacity
              </span>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Checked In Attendance
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {checkedInCount}
              </span>
              <span className="text-xs text-slate-500">
                Checked In ({attendanceRate}%)
              </span>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Pending Arrival
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-amber-500">
                {eventRegistrations.length - checkedInCount}
              </span>
              <span className="text-xs text-slate-500">Awaiting Check-in</span>
            </div>
          </div>
        </div>
      )}

      {/* Check-in scanner & Verification panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Camera / Manual Scanner */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Scanner Station
                </h3>
                <p className="text-xs text-slate-500">Camera scanning or manual Registration ID</p>
              </div>

              {!isCameraActive ? (
                <button
                  id="start-camera-scan-btn"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <button
                  id="stop-camera-scan-btn"
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Stop Camera</span>
                </button>
              )}
            </div>

            {/* Video Viewport */}
            {isCameraActive ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border-2 border-emerald-500 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Laser scan animation line */}
                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 bg-black/70 text-white text-[11px] p-2 rounded-lg text-center backdrop-blur-xs">
                  Camera active. Point at ticket QR code.
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-900/30">
                <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-2 opacity-70" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Ready to scan attendee digital tickets
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click "Start Camera" above or type/paste Registration ID below.
                </p>
              </div>
            )}

            {/* Manual Entry Form */}
            <form onSubmit={handleManualCheckIn} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Enter Registration ID or QR payload
              </label>
              <div className="flex gap-2">
                <input
                  id="manual-ticket-id-input"
                  type="text"
                  value={inputRegId}
                  onChange={(e) => setInputRegId(e.target.value)}
                  placeholder="e.g. REG-AI2026-8842"
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  id="verify-checkin-btn"
                  type="submit"
                  disabled={isVerifying || !inputRegId.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* 1-Click Fast Simulation for Registered Attendees of this event */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span>Instant Test-Scan Registered Tickets:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {eventRegistrations.slice(0, 4).map((reg) => {
                  const isAlreadyDone = reg.ticketStatus === 'Checked In';
                  return (
                    <button
                      key={reg.id}
                      type="button"
                      id={`simulate-scan-${reg.id}`}
                      onClick={() => performCheckIn(reg.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        isAlreadyDone
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                      }`}
                    >
                      <span className="font-mono">{reg.id}</span>
                      <span className="opacity-70">({reg.attendeeName.split(' ')[0]})</span>
                      {isAlreadyDone ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 px-1 rounded">
                          Scan
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Result Card */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[380px] flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Check-In Verification Status
              </h3>

              {lastCheckInResult.status === 'idle' && (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto text-slate-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Awaiting Scan
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Scan a QR code or click a test attendee to verify attendance status.
                  </p>
                </div>
              )}

              {lastCheckInResult.status === 'success' && lastCheckInResult.registration && (
                <div className="space-y-4 animate-in zoom-in-95 duration-200">
                  {/* Big Green Banner */}
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-emerald-800 dark:text-emerald-300">
                        ✓ Check-in Successful
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Attendance marked at{' '}
                        {new Date(
                          lastCheckInResult.registration.checkedInAt || ''
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Attendee Details Card */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                          Attendee Profile
                        </span>
                        <h5 className="text-base font-bold text-slate-900 dark:text-white">
                          {lastCheckInResult.registration.attendeeName}
                        </h5>
                        <p className="text-xs text-slate-500">
                          {lastCheckInResult.registration.attendeeEmail}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                        {lastCheckInResult.registration.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Organization</span>
                        <span className="font-semibold">
                          {lastCheckInResult.registration.organization || 'Independent'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Designation</span>
                        <span className="font-semibold">
                          {lastCheckInResult.registration.designation || 'Attendee'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Dietary</span>
                        <span className="font-semibold">
                          {lastCheckInResult.registration.dietaryPreference || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Verified By</span>
                        <span className="font-semibold">
                          {lastCheckInResult.registration.checkedInBy || 'Staff'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {lastCheckInResult.status === 'duplicate' && lastCheckInResult.registration && (
                <div className="space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-amber-800 dark:text-amber-300">
                        ✕ Already Checked In
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        {lastCheckInResult.message}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {lastCheckInResult.registration.attendeeName} (Ticket ID:{' '}
                      {lastCheckInResult.registration.id})
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Check-in timestamp:{' '}
                      {new Date(
                        lastCheckInResult.registration.checkedInAt || ''
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {lastCheckInResult.status === 'error' && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center gap-3 animate-in zoom-in-95 duration-200">
                  <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-rose-800 dark:text-rose-300">
                      ✕ Invalid Registration
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-400">
                      {lastCheckInResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
              <span>Security: Double check badge before granting physical lanyard.</span>
              <button
                onClick={() => setLastCheckInResult({ status: 'idle', message: '' })}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Participant List & Real-time Check-in Log Table */}
      <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Event Attendee Roster
            </h3>
            <p className="text-xs text-slate-500">
              Showing all registered participants for {selectedEvent?.title}
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full w-fit">
            {checkedInCount} / {eventRegistrations.length} Checked In
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Registration ID</th>
                <th className="px-4 py-3">Attendee Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Check-in Time</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {eventRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No registrations found for this event yet.
                  </td>
                </tr>
              ) : (
                eventRegistrations.map((reg) => {
                  const isDone = reg.ticketStatus === 'Checked In';
                  return (
                    <tr
                      key={reg.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {reg.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {reg.attendeeName}
                      </td>
                      <td className="px-4 py-3">{reg.attendeeEmail}</td>
                      <td className="px-4 py-3">{reg.organization || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isDone
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {reg.ticketStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {reg.checkedInAt
                          ? new Date(reg.checkedInAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isDone ? (
                          <button
                            onClick={() => performCheckIn(reg.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                          >
                            Check-In
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            ✓ Done
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
