import React, { useState, useEffect } from 'react';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
  sendTestNotificationAlert,
} from '../services/settingsService';
import { getStoredUser } from '../services/authService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_CHANNELS = [
  { id: 'orders', label: 'Yard Orders & Requisitions', icon: 'local_shipping', desc: 'Online cart checkout & logistics tracking' },
  { id: 'compressors', label: 'Air Compressor Requests', icon: 'air', desc: 'Electric & diesel compressor quotation RFQs' },
  { id: 'parts', label: 'OEM Spare Parts Requests', icon: 'build', desc: 'Component, valve & filter procurement inquiries' },
  { id: 'leasing', label: 'Equipment Leasing & Rentals', icon: 'car_rental', desc: 'Fleet lease, daily CFM & site rental requests' },
  { id: 'lubricants', label: 'Lubricants & Special Fluids', icon: 'water_drop', desc: 'Compressor coolant, flushing fluid & oil inquiries' },
  { id: 'inquiries', label: 'Storefront RFQs & Inquiries', icon: 'contact_support', desc: 'General contact form submissions & consultations' },
];

export default function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [enabledTypes, setEnabledTypes] = useState<string[]>(AVAILABLE_CHANNELS.map((c) => c.id));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUser = getStoredUser();

  useEffect(() => {
    if (!isOpen) return;
    loadSettings();
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetchNotificationSettings();
      if (res?.data) {
        setEmails(res.data.emails || []);
        if (res.data.enabled_types && res.data.enabled_types.length > 0) {
          setEnabledTypes(res.data.enabled_types);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load notification settings:', err);
      // Fallback
      if (currentUser?.email) {
        setEmails([currentUser.email]);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleAddEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newEmailInput.trim().toLowerCase();
    if (!clean) return;

    if (!validateEmail(clean)) {
      setFeedbackMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (emails.includes(clean)) {
      setFeedbackMsg({ type: 'error', text: 'This email is already in the recipient list.' });
      return;
    }

    setEmails([...emails, clean]);
    setNewEmailInput('');
    setFeedbackMsg(null);
  };

  const handleRemoveEmail = (target: string) => {
    if (emails.length <= 1) {
      if (!window.confirm('Removing all emails will leave no recipient for request alerts. Are you sure?')) {
        return;
      }
    }
    setEmails(emails.filter((e) => e !== target));
  };

  const handleToggleChannel = (channelId: string) => {
    setEnabledTypes((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    );
  };

  const handleSave = async () => {
    if (emails.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'Please provide at least one recipient email address.' });
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);

    try {
      const res = await updateNotificationSettings(emails, enabledTypes);
      setFeedbackMsg({
        type: 'success',
        text: res.message || 'Alert recipient settings saved successfully!',
      });
      setTimeout(() => {
        setFeedbackMsg(null);
      }, 4000);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to save notification settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (emails.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'Please add at least one email address to send a test alert.' });
      return;
    }

    setTesting(true);
    setFeedbackMsg(null);

    try {
      const res = await sendTestNotificationAlert(emails);
      setFeedbackMsg({
        type: 'success',
        text: `✅ ${res.message || 'Test email dispatched! Check your inbox/spam.'}`,
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `Test failed: ${err.message || 'Check email service configuration.'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-outline-variant overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">mark_email_unread</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-deep-charcoal">
                Storefront Request Email Alerts
              </h3>
              <p className="text-secondary text-xs">
                Configure which email addresses receive instant alerts whenever clients place orders or quotation requests.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-deep-charcoal hover:bg-surface-container rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div
            className={`px-5 py-3 border-b text-xs font-semibold flex items-center justify-between ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                {feedbackMsg.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold hover:underline">
              ✕
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-secondary">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary">
                progress_activity
              </span>
              <p className="font-semibold">Loading alert settings...</p>
            </div>
          ) : (
            <>
              {/* Recipient Emails Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-deep-charcoal uppercase tracking-wider block">
                      Alert Recipient Emails
                    </label>
                    <p className="text-secondary text-[11px]">
                      Instant notifications with customer details, requested machinery, and 1-click admin links will be sent here.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {emails.length} active recipient{emails.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Chips of existing emails */}
                <div className="flex flex-wrap gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant min-h-[50px] items-center">
                  {emails.length === 0 ? (
                    <span className="text-secondary text-xs italic">
                      No emails configured. Storefront requests will only be stored in database.
                    </span>
                  ) : (
                    emails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-deep-charcoal border border-outline-variant shadow-2xs group"
                      >
                        <span className="material-symbols-outlined text-sm text-primary">mail</span>
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          title={`Remove ${email}`}
                          className="ml-1 text-gray-400 hover:text-rose-600 font-bold transition-colors"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add new email input */}
                <form onSubmit={handleAddEmail} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                      add_link
                    </span>
                    <input
                      type="email"
                      placeholder="Enter admin email (e.g. sales@mandtech.com.ng)..."
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-outline-variant rounded-lg text-xs font-medium text-deep-charcoal outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-deep-charcoal text-white hover:bg-black font-button text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Add Email</span>
                  </button>
                </form>

                {/* Quick Add helper if current user is not in list */}
                {currentUser?.email && !emails.includes(currentUser.email.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => setEmails([...emails, currentUser.email.toLowerCase()])}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">add_circle</span>
                    <span>Add my logged-in email ({currentUser.email})</span>
                  </button>
                )}
              </div>

              {/* Alert Notification Channels */}
              <div className="space-y-3 pt-4 border-t border-outline-variant/60">
                <div>
                  <label className="text-xs font-black text-deep-charcoal uppercase tracking-wider block">
                    Trigger Alert On
                  </label>
                  <p className="text-secondary text-[11px]">
                    Select which storefront request types should dispatch real-time email notifications.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {AVAILABLE_CHANNELS.map((ch) => {
                    const isChecked = enabledTypes.includes(ch.id);
                    return (
                      <label
                        key={ch.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-primary/5 border-primary/40 text-deep-charcoal'
                            : 'bg-white border-outline-variant text-secondary opacity-75 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleChannel(ch.id)}
                          className="mt-0.5 accent-primary h-4 w-4 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <span className="material-symbols-outlined text-base text-primary">
                              {ch.icon}
                            </span>
                            <span>{ch.label}</span>
                          </div>
                          <p className="text-[11px] text-secondary mt-0.5 leading-tight">
                            {ch.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Info Note */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-blue-600 text-base shrink-0 mt-0.5">
                  info
                </span>
                <p className="leading-relaxed">
                  <strong>Zero-delay dispatch:</strong> Alert emails are processed asynchronously in the background. Storefront customers will experience instant submissions with no loading delays, while administrators receive immediate email alerts with direct links back to this portal.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            disabled={testing || loading || emails.length === 0}
            onClick={handleSendTest}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-outline-variant hover:bg-surface-container text-deep-charcoal font-button text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${testing ? 'animate-spin' : 'send'}`}>
              {testing ? 'progress_activity' : 'send'}
            </span>
            <span>{testing ? 'Dispatching Test...' : 'Send Test Alert Email'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-outline-variant bg-white hover:bg-surface-container text-secondary font-button text-xs font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || loading || emails.length === 0}
              onClick={handleSave}
              className="flex-1 sm:flex-none px-5 py-2 bg-primary text-white hover:bg-black font-button text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>Save Alert Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
