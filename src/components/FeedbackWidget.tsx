import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquareHeart, 
  X, 
  Star, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Sparkles,
  Heart
} from 'lucide-react';
import { AppTheme, AppLanguage } from '../types';

interface FeedbackWidgetProps {
  theme: AppTheme;
  language?: AppLanguage;
}

type FeedbackCategory = 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor';

interface CategoryOption {
  id: FeedbackCategory;
  labelEn: string;
  labelHi: string;
  emoji: string;
  defaultStar: number;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'Excellent', labelEn: 'Excellent', labelHi: 'बहुत बढ़िया', emoji: '😊', defaultStar: 5 },
  { id: 'Good', labelEn: 'Good', labelHi: 'अच्छा', emoji: '🙂', defaultStar: 4 },
  { id: 'Average', labelEn: 'Average', labelHi: 'औसत', emoji: '😐', defaultStar: 3 },
  { id: 'Poor', labelEn: 'Poor', labelHi: 'खराब', emoji: '🙁', defaultStar: 2 },
  { id: 'Very Poor', labelEn: 'Very Poor', labelHi: 'बहुत खराब', emoji: '😡', defaultStar: 1 },
];

export default function FeedbackWidget({ theme, language = 'en' }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [name, setName] = useState('');
  
  // Submission lifecycle states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Modal active check: completely hide widget when any full-screen modal (e.g. photo crop station) is active
  const [isModalActive, setIsModalActive] = useState(false);

  useEffect(() => {
    const checkModal = () => {
      setIsModalActive(document.body.classList.contains('snapid-modal-open'));
    };
    checkModal();

    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Listen for global open feedback modal event
  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
      setIsSubmitted(false);
    };

    window.addEventListener('open-feedback-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-feedback-modal', handleOpenModal);
    };
  }, []);

  // Close when clicking outside the card and button
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        cardRef.current && 
        !cardRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle star selection
  const handleSelectRating = (stars: number) => {
    setRating(stars);
    setErrorMessage(null);
    // Auto sync category when star is clicked
    const matchedCategory = CATEGORIES.find(c => c.defaultStar === stars);
    if (matchedCategory) {
      setCategory(matchedCategory.id);
    }
  };

  // Handle category selection (Emoji click)
  const handleSelectCategory = (cat: FeedbackCategory) => {
    setCategory(cat);
    setErrorMessage(null);
    const matched = CATEGORIES.find(c => c.id === cat);
    if (matched) {
      setRating(matched.defaultStar);
    }
  };

  // Reset form
  const handleResetForm = () => {
    setRating(0);
    setHoverRating(0);
    setCategory(null);
    setFeedbackText('');
    setName('');
    setIsSubmitted(false);
    setErrorMessage(null);
  };

  // Submit feedback to server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1) {
      setErrorMessage(
        language === 'hi' 
          ? 'कृपया अपना अनुभव रेटिंग (1–5 सितारे) चुनें।' 
          : 'Please select a star rating (1–5 stars) to proceed.'
      );
      return;
    }

    const chosenCategory = category || (
      rating === 5 ? 'Excellent' :
      rating === 4 ? 'Good' :
      rating === 3 ? 'Average' :
      rating === 2 ? 'Poor' : 'Very Poor'
    );

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          category: chosenCategory,
          feedback: feedbackText.trim(),
          name: name.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSubmitted(true);
        // Broadcast custom event so Public Feedback Section updates in real time
        window.dispatchEvent(new CustomEvent('feedback-submitted', { detail: result.data }));
      } else {
        throw new Error(result.error || 'Failed to save feedback');
      }
    } catch (err: any) {
      console.error('Feedback submit error:', err);
      setErrorMessage(
        language === 'hi'
          ? 'फीडबैक सहेजने में विफल। कृपया पुनः प्रयास करें।'
          : 'Failed to submit feedback. Please check your network and retry.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHindi = language === 'hi';

  if (isModalActive) {
    return null;
  }

  return (
    <aside 
      aria-label="User Feedback"
      className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 flex flex-col items-end pointer-events-auto"
    >
      {/* ========================================================
          FEEDBACK CARD (Animated Compact Popover with Ambient Glow)
         ======================================================== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`mb-2.5 w-[calc(100vw-24px)] sm:w-[340px] max-w-[360px] rounded-2xl p-4 sm:p-5 transition-colors ${
              theme === 'dark'
                ? 'bg-slate-900/95 text-white border border-blue-500/35 shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(59,130,246,0.18)] ring-1 ring-blue-400/20 backdrop-blur-xl'
                : 'bg-white/95 text-slate-900 border border-blue-400/40 shadow-[0_16px_36px_rgba(15,23,42,0.12),0_0_16px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/15 backdrop-blur-xl'
            }`}
          >
            {/* Header with Title & Close Button */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <MessageSquareHeart className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                    {isHindi ? 'फीडबैक भेजें' : 'Share Feedback'}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isHindi ? 'SnapID Studio को और बेहतर बनाएं' : 'Help us improve SnapID Studio'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isHindi ? 'बंद करें' : 'Close'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content Body: Success Screen OR Input Form */}
            {isSubmitted ? (
              <div className="py-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {isHindi ? '🎉 आपके फीडबैक के लिए धन्यवाद!' : '🎉 Thank you for your feedback!'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
                    {isHindi 
                      ? 'आपका फीडबैक SnapID Studio को और बेहतर बनाने में हमारी मदद करता है।' 
                      : 'Your feedback helps us improve SnapID Studio.'}
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer hover:shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                  >
                    {isHindi ? 'ठीक है (Done)' : 'Done'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-0.5 cursor-pointer"
                  >
                    {isHindi ? 'अन्य फीडबैक भेजें' : 'Send Another Feedback'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                
                {/* 1. How was your experience? (1–5 Stars) */}
                <div className="space-y-1.5 text-center">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {isHindi ? 'आपका अनुभव कैसा रहा?' : 'How was your experience?'}
                    </label>
                    {rating > 0 && (
                      <span className="text-[11px] font-extrabold text-amber-500 dark:text-amber-400 flex items-center gap-1">
                        <span>{rating} / 5</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({category ? (isHindi ? CATEGORIES.find(c => c.id === category)?.labelHi : category) : ''})
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isHighlighted = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => handleSelectRating(star)}
                          className="p-1 cursor-pointer focus:outline-none"
                          title={`${star} Star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`w-6 h-6 sm:w-7 sm:h-7 ${
                              isHighlighted
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]'
                                : theme === 'dark'
                                ? 'text-slate-700 fill-slate-800 hover:text-amber-400/60'
                                : 'text-slate-300 fill-slate-100 hover:text-amber-400/60'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. What did you think? (Categories / Emojis) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    {isHindi ? 'आप क्या सोचते हैं?' : 'What did you think?'}
                  </label>

                  <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const isCatSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelectCategory(cat.id)}
                          onMouseEnter={() => setHoverRating(cat.defaultStar)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={`py-1.5 px-0.5 rounded-xl text-center border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isCatSelected
                              ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/40 shadow-[0_0_10px_rgba(59,130,246,0.35)] scale-102'
                              : theme === 'dark'
                              ? 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750 hover:text-white hover:border-slate-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                          }`}
                          title={`${cat.defaultStar} Star - ${isHindi ? cat.labelHi : cat.labelEn}`}
                        >
                          <span className="text-xl leading-none">{cat.emoji}</span>
                          <span className="text-[9.5px] font-bold leading-tight truncate max-w-full">
                            {isHindi ? cat.labelHi : cat.labelEn}
                          </span>
                          <span className={`text-[9px] font-semibold ${isCatSelected ? 'text-blue-100' : 'text-amber-500/90'}`}>
                            {cat.defaultStar}★
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Tell us more (Optional) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {isHindi ? 'विवरण (वैकल्पिक)' : 'Feedback Message'}
                    </label>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {feedbackText.length}/400
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={400}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={
                      isHindi 
                        ? 'यहाँ अपना फीडबैक लिखें...' 
                        : 'Write your experience here...'
                    }
                    className={`w-full p-2 rounded-lg text-xs border outline-none resize-none ${
                      theme === 'dark'
                        ? 'bg-slate-950/70 border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                </div>

                {/* 4. Name (Optional) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    {isHindi ? 'आपका नाम (वैकल्पिक)' : 'Your Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isHindi ? 'उदा. राहुल / Anonymous' : 'e.g. Rahul / Anonymous'}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none ${
                      theme === 'dark'
                        ? 'bg-slate-950/70 border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[11px] font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 5. Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className={`w-full py-2.5 px-3 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    rating === 0
                      ? 'bg-slate-600/50 opacity-50 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 hover:shadow-[0_0_16px_rgba(59,130,246,0.45)] active:scale-[0.99]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isHindi ? 'सहेज रहे हैं...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{isHindi ? 'फीडबैक सबमिट करें' : 'Submit Feedback'}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          COMPACT 3D FLOATING FEEDBACK BUTTON (Modern Vector Icon)
         ======================================================== */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative z-10 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-extrabold text-xs tracking-wide text-white cursor-pointer flex items-center gap-2 select-none ${
          isOpen
            ? 'bg-slate-800 hover:bg-slate-700 border-b-2 border-slate-900 shadow-md'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-b-2 border-indigo-900 shadow-[0_6px_18px_rgba(37,99,235,0.35)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.5)] active:border-b'
        }`}
        title={isOpen ? (isHindi ? 'फीडबैक बंद करें' : 'Close Feedback') : (isHindi ? 'फीडबैक दें' : 'Give Feedback')}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-3.5 h-3.5 text-white" />
        ) : (
          <MessageSquareHeart className="w-4 h-4 text-white drop-shadow-xs transition-transform group-hover:scale-110" />
        )}
        <span className="font-display font-bold drop-shadow-xs">
          {isOpen 
            ? (isHindi ? 'बंद करें' : 'Close') 
            : (isHindi ? 'फीडबैक' : 'Feedback')}
        </span>
      </button>
    </aside>
  );
}
