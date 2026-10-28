import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SayHiModal({ peer, isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [createdConvId, setCreatedConvId] = useState(null);

  // Generate contextual openers based on peer attributes
  const firstName = peer?.name ? peer.name.split(' ')[0] : 'there';
  const topSkill = peer?.skills?.[0] || peer?.tags?.[0] || 'systems';
  const hostelName = peer?.hostel ? peer.hostel.split('•')[0].trim() : 'campus';
  const courseCode = peer?.courses?.[0] || 'CS204';

  const suggestedOpeners = [
    `Hey ${firstName}! Saw you are exploring ${topSkill}. Want to bounce ideas or study together?`,
    `Hi ${firstName}! Working on ${courseCode} lab viva prep. Up for pairing up or comparing notes?`,
    `Hey! Saw you're also in ${hostelName}. Want to grab chai at Prabha Bhawan canteen?`,
    `Hi ${firstName}! Looking for teammates for the upcoming Sphinx hackathon. Interested in teaming up?`,
  ];

  // Set default opener when opened
  useEffect(() => {
    if (isOpen && peer) {
      setNote(suggestedOpeners[0]);
      setErrorMsg('');
      setSentSuccess(false);
      setCreatedConvId(null);
    }
  }, [isOpen, peer]);

  if (!isOpen || !peer) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMsg('Please enter a friendly note before sending.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/messages/say-hi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: peer.id || peer.rollNumber,
          note: note.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'AWAITING_REPLY') {
          setErrorMsg(data.message || 'You already sent an introductory note. Please wait for their reply.');
          if (data.conversationId) setCreatedConvId(data.conversationId);
        } else {
          throw new Error(data.message || 'Failed to dispatch note.');
        }
        return;
      }

      setSentSuccess(true);
      setCreatedConvId(data.conversation?.id);
      if (onSuccess) onSuccess(data.conversation, data.sentMessage);
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred while sending note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-md md:p-space-lg shadow-xl border border-outline-variant/30 flex flex-col gap-space-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="say-hi-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-space-xs border-b border-surface-container/60">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/60 flex items-center justify-center text-primary text-xl">
              👋
            </div>
            <div>
              <h2 id="say-hi-title" className="font-heading text-title-md font-bold text-on-surface">
                Say Hi to {peer.name}
              </h2>
              <p className="font-heading text-label-sm text-on-surface-variant">
                {peer.batch || `Class of ${peer.batchYear || '2027'}`} • {peer.hostel || 'Hostel 4'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-space-md flex flex-col items-center text-center gap-space-sm">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary text-2xl">
              ✓
            </div>
            <h3 className="font-heading text-title-md font-bold text-on-surface">
              Introductory Note Sent!
            </h3>
            <p className="font-sans text-body-sm text-on-surface-variant max-w-sm">
              Your message was sent to {peer.name}. To keep CampusConnect low-pressure, you can send another message once they reply.
            </p>

            <div className="flex items-center gap-space-sm mt-space-sm w-full">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl font-heading text-label-md text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/messages');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading font-semibold text-label-md transition-colors shadow-xs"
              >
                Open Messages
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col gap-space-sm">
            {/* Campus Protocol Notice */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">
                info
              </span>
              <p className="font-sans text-body-xs text-on-surface-variant leading-relaxed">
                <strong>No friend requests:</strong> Saying Hi starts a direct 1-on-1 chat. To prevent spam and maintain a calm campus commons, you are limited to <strong>one message</strong> until {firstName} replies.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-error-container/20 border border-error/30 text-error rounded-xl font-sans text-body-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Suggested Campus Openers */}
            <div className="flex flex-col gap-1.5">
              <span className="font-heading text-label-xs text-on-surface-variant font-semibold uppercase tracking-wider">
                Suggested Campus Openers (Tap to apply):
              </span>
              <div className="flex flex-col gap-1.5">
                {suggestedOpeners.map((opener, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNote(opener)}
                    className={`text-left p-2 rounded-xl text-body-xs font-sans transition-all border ${
                      note === opener
                        ? 'bg-primary-fixed/40 border-primary text-on-primary-fixed-variant font-medium'
                        : 'bg-surface-container-low/60 hover:bg-surface-container border-outline-variant/20 text-on-surface-variant'
                    }`}
                  >
                    "{opener}"
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Note Composer */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="say-hi-note" className="font-heading text-label-sm text-on-surface font-semibold">
                  Custom Starter Note:
                </label>
                <span className="font-sans text-body-xs text-outline">
                  {note.length}/300
                </span>
              </div>
              <textarea
                id="say-hi-note"
                rows={3}
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a calm, friendly message..."
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm p-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-space-xs border-t border-surface-container/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-on-surface-variant font-heading text-label-md hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !note.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary font-heading font-semibold text-label-md transition-colors shadow-xs"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Starter Note</span>
                    <span>👋</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
