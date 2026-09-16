import React, { useState, useEffect, useCallback } from 'react';
import { 
  Star, 
  MessageSquareHeart, 
  Quote, 
  Calendar, 
  Sparkles, 
  RefreshCw, 
  UserCheck, 
  MessageCircle
} from 'lucide-react';
import { AppTheme, AppLanguage } from '../types';

interface UserFeedbackSectionProps {
  theme: AppTheme;
  language?: AppLanguage;
  onOpenFeedbackModal?: () => void;
}

export interface FeedbackItem {
  id: string;
  rating: number;
  category: string;
  feedback: string;
  name?: string;
  createdAt: string;
}

export default function UserFeedbackSection({
  theme,
  language = 'en',
  onOpenFeedbackModal
}: UserFeedbackSectionProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isHindi = language === 'hi';

  const fetchFeedbacks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/feedback');
      if (!response.ok) {
        throw new Error('Failed to load feedbacks');
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.feedbacks)) {
        setFeedbacks(data.feedbacks);
      }
    } catch (err: any) {
      console.error('Error loading feedbacks:', err);
      setError('Unable to load feedbacks right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();

    // Refresh when a new feedback is submitted via the popup
    const handleFeedbackSubmitted = () => {
      fetchFeedbacks();
    };

    window.addEventListener('feedback-submitted', handleFeedbackSubmitted);
    return () => {
      window.removeEventListener('feedback-submitted', handleFeedbackSubmitted);
    };
  }, [fetchFeedbacks]);

  const handleOpenPopup = () => {
    if (onOpenFeedbackModal) {
      onOpenFeedbackModal();
    } else {
      window.dispatchEvent(new CustomEvent('open-feedback-modal'));
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Recently';
      return date.toLocaleDateString(isHindi ? 'hi-IN' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <section 
      id="user-feedback-section"
      aria-label="User Feedback"
      className="space-y-6 pt-6"
    >
      {/* ========================================================
          SECTION HEADER
         ======================================================== */}
      <div className={`p-6 sm:p-7 rounded-3xl border relative overflow-hidden ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/30 border-slate-900 shadow-xl'
          : 'bg-gradient-to-r from-white via-slate-50 to-blue-50/40 border-slate-200 shadow-sm'
      }`}>
        {/* Ambient background glow accents */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/15 mb-2.5">
              <MessageSquareHeart className="w-3.5 h-3.5" />
              <span>{isHindi ? 'सार्वजनिक समीक्षाएँ' : 'Community Reviews'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>💬</span>
              <span>{isHindi ? 'हमारे उपयोगकर्ता क्या कहते हैं' : 'What Our Users Say'}</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-xl leading-relaxed">
              {isHindi 
                ? 'SnapID Studio का उपयोग करने वाले लोगों से वास्तविक फीडबैक' 
                : 'Real feedback from people using SnapID Studio'}
            </p>
          </div>

          {/* Header Action Button: Leave Feedback */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={fetchFeedbacks}
              disabled={isLoading}
              title={isHindi ? 'ताज़ा करें' : 'Refresh Feedback'}
              className={`p-2.5 rounded-xl border cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleOpenPopup}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isHindi ? '💬 फीडबैक दें' : '💬 Leave Feedback'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          FEEDBACK CARDS GRID
         ======================================================== */}
      {isLoading && feedbacks.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`p-5 rounded-2xl border animate-pulse space-y-3 ${
                theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="w-4 h-4 rounded bg-slate-700/40" />
                ))}
              </div>
              <div className="h-4 bg-slate-700/30 rounded w-5/6" />
              <div className="h-4 bg-slate-700/20 rounded w-4/6" />
              <div className="pt-2 flex justify-between items-center">
                <div className="h-3 bg-slate-700/30 rounded w-1/3" />
                <div className="h-3 bg-slate-700/30 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        /* Empty State */
        <div className={`p-8 sm:p-10 rounded-3xl border text-center space-y-4 ${
          theme === 'dark'
            ? 'bg-slate-950/70 border-slate-900 text-slate-400'
            : 'bg-white border-slate-200 text-slate-600 shadow-sm'
        }`}>
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              {isHindi ? 'पहला अनुभव साझा करें!' : 'Be the first to share your experience!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {isHindi 
                ? 'SnapID Studio के बारे में अपना अनुभव बताएं। आपका फीडबैक हमारे लिए बेहद मूल्यवान है।' 
                : 'Help others discover how SnapID Studio makes ID & passport photo creation fast, private, and effortless.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenPopup}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{isHindi ? '💬 फीडबैक दें' : '💬 Leave Feedback'}</span>
          </button>
        </div>
      ) : (
        /* Populated Feedbacks Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {feedbacks.map((item) => {
            const userName = (item.name && item.name.trim()) ? item.name.trim() : (isHindi ? 'Anonymous' : 'Anonymous');
            const displayFeedback = item.feedback && item.feedback.trim() ? item.feedback.trim() : item.category;

            return (
              <div
                key={item.id}
                className={`group relative rounded-2xl p-5 border flex flex-col justify-between ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 border-slate-900/90 hover:border-blue-500/40 shadow-[0_8px_20px_rgba(0,0,0,0.5)] ring-1 ring-white/5'
                    : 'bg-white border-slate-200/90 hover:border-blue-400/60 shadow-[0_4px_16px_rgba(15,23,42,0.06)] ring-1 ring-slate-100'
                }`}
              >
                <div>
                  {/* Top Row: Stars + Category Pill */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-900">
                    {/* Golden Stars Rating */}
                    <div className="flex items-center gap-1" aria-label={`${item.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= item.rating
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                              : theme === 'dark'
                              ? 'text-slate-800 fill-slate-800'
                              : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Category / Impression Badge */}
                    {item.category && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.rating >= 4
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : item.rating === 3
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* Feedback Message */}
                  <div className="relative my-2">
                    <Quote className="w-5 h-5 text-blue-500/20 dark:text-blue-400/15 absolute -top-1 -left-1 pointer-events-none" />
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed pl-4 font-normal italic break-words">
                      “{displayFeedback}”
                    </p>
                  </div>
                </div>

                {/* Bottom Signature & Date */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                    <span className="text-blue-500 font-semibold">—</span>
                    <span className="truncate max-w-[150px]">{userName}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
