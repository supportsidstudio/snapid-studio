import React, { useState } from 'react';
import { Mail, CheckCircle2, MessageSquare, Send, Copy, Check } from 'lucide-react';
import { AppLanguage, AppTheme } from '../types';
import { translations } from '../translations';
import emailjs from '@emailjs/browser';

// EmailJS Configuration Options
// Configure these keys either directly below or in your environment variables (.env file)
// To set via environment variables, add VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID,
// and VITE_EMAILJS_PUBLIC_KEY in your deployment environment or locally in .env.
const EMAILJS_SERVICE_ID = (import.meta.env.VITE_EMAILJS_SERVICE_ID as string) || 'service_jfu6eqo';
const EMAILJS_TEMPLATE_ID = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string) || 'template_aqwgfxt';
const EMAILJS_PUBLIC_KEY = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string) || '-kJMOXT3IvVdWlBte';

interface ContactSectionProps {
  language: AppLanguage;
  theme: AppTheme;
}

export default function ContactSection({ language, theme }: ContactSectionProps) {
  const t = translations[language];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const supportEmail = 'supportsidstudio@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    setErrorMsg('');

    // Check if the developer hasn't configured EmailJS yet
    if (
      EMAILJS_SERVICE_ID.includes('PLACEHOLDER') ||
      EMAILJS_TEMPLATE_ID.includes('PLACEHOLDER') ||
      EMAILJS_PUBLIC_KEY.includes('PLACEHOLDER')
    ) {
      setIsSending(false);
      setErrorMsg(
        language === 'hi'
          ? 'कृपया ईमेल भेजने को सक्षम करने के लिए ContactSection.tsx में या .env फ़ाइल में अपने EmailJS क्रेडेंशियल (Service ID, Template ID, Public Key) सेट करें।'
          : 'Please configure your EmailJS credentials (Service ID, Template ID, and Public Key) in ContactSection.tsx or in your .env file to enable email sending.'
      );
      return;
    }

    try {
      // Safely initialize EmailJS in case of any dynamic runtime requirements in SDK v4
      emailjs.init({
        publicKey: EMAILJS_PUBLIC_KEY,
      });

      const templateParams = {
        // Standard template variables
        from_name: name || 'SnapID User',
        from_email: email || 'no-reply@snapid.com',
        reply_to: email || 'no-reply@snapid.com',
        message: message,
        
        // Common template variants to support any custom EmailJS templates
        name: name || 'SnapID User',
        email: email || 'no-reply@snapid.com',
        message_html: message,
        user_name: name || 'SnapID User',
        user_email: email || 'no-reply@snapid.com',
        contact_message: message,
      };

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        {
          publicKey: EMAILJS_PUBLIC_KEY,
        }
      );

      console.log('EmailJS response status:', result.status, result.text);
      setSubmitted(true);
    } catch (err: any) {
      console.error('EmailJS submit error:', err);
      let errorMessage = '';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        errorMessage = err.text || err.message || JSON.stringify(err);
      }
      
      setErrorMsg(
        errorMessage ||
        (language === 'hi'
          ? 'EmailJS के माध्यम से संदेश भेजने में असमर्थ। कृपया क्रेडेंशियल या नेटवर्क की जांच करें।'
          : 'Failed to send message via EmailJS. Please verify your keys and connection.')
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black font-display tracking-tight text-inherit flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-500" />
          <span>{t.contactTitle}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">{t.contactTagline}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Contact info sheet */}
        <div className={`md:col-span-5 p-6 rounded-2xl border flex flex-col justify-between space-y-6 ${
          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-inherit">SnapID Help Desk</h3>
                <p className="text-[10px] text-slate-400">Online & Offline Support Interface</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {language === 'hi'
                ? 'यदि आपके पास कोई प्रश्न, सुझाव या सहयोग अनुरोध है, तो कृपया बेझिझक संदेश भेजें या सीधे ईमेल करें।'
                : 'Have questions, visual bugs, custom feature ideas or business support needs? Get in touch with our tech desk anytime.'}
            </p>
          </div>

          {/* Email Card Highlight */}
          <div className={`p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-150'
          } space-y-2`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Support Email Address
            </span>
            <div className="flex items-center justify-between gap-2 bg-slate-950/20 px-3 py-2 rounded-lg border border-inherit">
              <span className="text-xs font-bold font-mono text-blue-500 truncate">
                {supportEmail}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="p-1 rounded bg-blue-500/10 hover:bg-blue-500/15 text-blue-500 transition-all shrink-0"
                title="Copy Address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              {language === 'hi' 
                ? 'हम आमतौर पर 12-24 घंटों में जवाब देते हैं।' 
                : 'We respond directly within 12-24 business hours.'}
            </p>
          </div>
        </div>

        {/* Comment Send Form */}
        <div className={`md:col-span-7 p-6 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-sm text-inherit">
                {language === 'hi' ? 'संदेश सफलतापूर्वक भेजा गया!' : 'Message Sent Successfully!'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                {language === 'hi' 
                  ? 'आपका संदेश सफलतापूर्वक भेज दिया गया है। हम जल्द ही आपसे संपर्क करेंगे।' 
                  : 'Your message has been successfully transmitted. Our team will review your message shortly.'}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:bg-slate-850' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {language === 'hi' ? 'नया लिखें' : 'Write Another'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Optional user details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1.5">
                    {t.contactNameLabel}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Your Name"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none transition-all ${
                      theme === 'dark' 
                        ? 'bg-slate-900/50 border-slate-800 focus:border-blue-500 focus:bg-slate-900 text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1.5">
                    {t.contactEmailLabel}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none transition-all ${
                      theme === 'dark' 
                        ? 'bg-slate-900/50 border-slate-800 focus:border-blue-500 focus:bg-slate-900 text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Message block requirements */}
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1.5">
                  {language === 'hi' ? 'आपका संदेश / कमेंट' : 'Your Comment / Message'}
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={language === 'hi' ? 'यहाँ अपना सन्देश या कमेंट टाइप करें...' : 'Write your detailed comment or inquiry here...'}
                  rows={5}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium border focus:outline-none transition-all resize-none ${
                    theme === 'dark' 
                      ? 'bg-slate-900/50 border-slate-800 focus:border-blue-500 focus:bg-slate-900 text-white' 
                      : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900'
                  }`}
                />
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-3.5">
                <button
                  type="submit"
                  disabled={isSending || !message.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-550 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white flex items-center justify-center gap-2 shadow-md shadow-blue-950/20"
                >
                  <Send className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
                  <span>{isSending ? (language === 'hi' ? 'भेजा जा रहा है...' : 'Sending Message...') : t.contactSendBtn}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
