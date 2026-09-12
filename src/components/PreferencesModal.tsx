import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EventCategory } from '../types';
import { SUPPORTED_CITIES } from '../utils/location';
import {
  MapPin,
  Navigation,
  Loader2,
  X,
  Check,
  Compass,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_CATEGORIES: { name: EventCategory; description: string; icon: string }[] = [
  { name: 'Technology', description: 'AI, Web3, Cloud, Developer summits', icon: '💻' },
  { name: 'Workshop', description: 'Hands-on practical training & masterclasses', icon: '🛠️' },
  { name: 'Hackathon', description: '48h building competitions, prizes, mentors', icon: '⚡' },
  { name: 'Business', description: 'Founders, venture capital, scaleups, SaaS', icon: '💼' },
  { name: 'Education', description: 'Academic lectures, research symposiums, student summits', icon: '🎓' },
  { name: 'Sports', description: 'Tournaments, marathons, esports, athletic gatherings', icon: '🏆' },
  { name: 'Music', description: 'Festivals, live concerts, acoustic evenings', icon: '🎵' },
  { name: 'Cultural', description: 'Arts exhibitions, film festivals, literary talks', icon: '🎭' },
];

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose }) => {
  const {
    userLocation,
    requestBrowserLocation,
    setManualCity,
    radiusFilter,
    setRadiusFilter,
    userInterests,
    updateUserInterests,
  } = useApp();

  const [selectedInterests, setSelectedInterests] = useState<EventCategory[]>(userInterests);
  const [isDetecting, setIsDetecting] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (category: EventCategory) => {
    setSelectedInterests((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleSavePreferences = async () => {
    await updateUserInterests(selectedInterests);
    onClose();
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    await requestBrowserLocation();
    setIsDetecting(false);
  };

  return (
    <div
      id="preferences-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="preferences-dialog"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Discovery Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize nearby events and AI recommendations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Geolocation & City Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Location & Nearby Radius
            </label>

            {/* Current City Pill & Auto-Detect Button */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Active City:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {userLocation.city}
                </span>
              </div>

              <button
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 border border-indigo-200/80 dark:border-indigo-800 transition-colors cursor-pointer"
              >
                {isDetecting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <Navigation className="w-4 h-4 text-indigo-600" />
                )}
                <span>Auto-Detect</span>
              </button>
            </div>

            {/* Quick City Selector */}
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5">
                Or select a major hub:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {SUPPORTED_CITIES.slice(0, 6).map((city) => (
                  <button
                    key={city.name}
                    onClick={() => setManualCity(city.name)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer truncate ${
                      userLocation.city.toLowerCase() === city.name.toLowerCase()
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Radius Slider */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600 dark:text-slate-400">Search Radius:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  Within {radiusFilter} km ({Math.round(radiusFilter * 0.621371)} miles)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                step="5"
                value={radiusFilter}
                onChange={(e) => setRadiusFilter(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5 km (Local)</span>
                <span>50 km</span>
                <span>150 km (Regional)</span>
              </div>
            </div>
          </div>

          {/* Interests Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Interests & Recommendation Topics
              </span>
              <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
                {selectedInterests.length} selected
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = selectedInterests.includes(cat.name);
                return (
                  <div
                    key={cat.name}
                    onClick={() => toggleInterest(cat.name)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-xs'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base">{cat.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {cat.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePreferences}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Apply Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
