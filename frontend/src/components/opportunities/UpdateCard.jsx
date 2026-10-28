import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sanitizeUrl } from '../../utils/sanitizeUrl';

/**
 * Format deadline and compute remaining days/urgency
 */
function getDeadlineStatus(deadlineStr, deadlineText) {
  if (!deadlineStr && !deadlineText) return null;

  if (!deadlineStr && deadlineText) {
    return {
      text: deadlineText,
      urgency: 'normal',
      isPast: false,
    };
  }

  try {
    const deadlineDate = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const formattedDate = deadlineDate.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (diffMs < 0) {
      return {
        text: deadlineText || `Closed on ${formattedDate}`,
        urgency: 'past',
        isPast: true,
      };
    } else if (diffHours <= 48) {
      return {
        text: deadlineText || `${formattedDate} (${diffHours}h remaining)`,
        urgency: 'critical',
        isPast: false,
      };
    } else if (diffDays <= 7) {
      return {
        text: deadlineText || `${formattedDate} (${diffDays} days left)`,
        urgency: 'warning',
        isPast: false,
      };
    } else {
      return {
        text: deadlineText || formattedDate,
        urgency: 'normal',
        isPast: false,
      };
    }
  } catch {
    return {
      text: deadlineText || deadlineStr,
      urgency: 'normal',
      isPast: false,
    };
  }
}

/**
 * Generate .ics calendar file download
 */
function downloadIcsCalendar(item) {
  const title = item.title;
  const description = item.description.replace(/\n/g, '\\n');
  const location = item.venue || 'MNIT Jaipur';
  const start = item.deadline ? new Date(item.deadline) : new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

  const formatDate = (date) =>
    date.toISOString().replace(/-|:|\.\d+/g, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusConnect//MNIT Updates//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function UpdateCard({
  item,
  currentUser,
  onToggleSave,
  onDelete,
  onTagClick,
  onSayHi,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedLocal, setSavedLocal] = useState(item.isSaved);

  const isOfficial = Boolean(item.isOfficial);
  const isAuthor = item.isAuthor || item.authorId === currentUser?.id;
  const isAdmin = currentUser?.role === 'admin';
  const canDelete = isAuthor || isAdmin;

  const deadlineStatus = getDeadlineStatus(item.deadline, item.deadlineText);

  const handleSaveClick = async () => {
    if (saveLoading) return;
    setSaveLoading(true);
    const prev = savedLocal;
    setSavedLocal(!prev); // Optimistic UI
    try {
      await onToggleSave(item.id, !prev);
    } catch {
      setSavedLocal(prev); // Revert on failure
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <article
      className={`rounded-2xl transition-all duration-200 relative overflow-hidden flex flex-col ${
        isOfficial
          ? 'bg-surface-container-lowest border-2 border-primary/20 shadow-xs hover:border-primary/40 hover:shadow-md'
          : 'bg-surface-container-lowest border border-outline-variant/40 shadow-2xs hover:border-outline-variant hover:shadow-xs'
      }`}
    >
      {/* Visual Accent Top Bar */}
      <div
        className={`h-1.5 w-full ${
          isOfficial
            ? 'bg-gradient-to-r from-primary via-primary-container to-tertiary'
            : 'bg-gradient-to-r from-emerald-500/70 via-teal-500/70 to-secondary/70'
        }`}
      />

      <div className="p-space-md sm:p-space-lg flex flex-col flex-1 gap-space-sm">
        {/* Top Badges Bar */}
        <div className="flex items-start justify-between gap-space-sm flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Distinct Official vs Student Badges */}
            {isOfficial ? (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-heading text-[12px] font-bold px-3 py-1 rounded-full border border-primary/25 shadow-2xs">
                <span className="material-symbols-outlined text-[16px] text-primary fill-1">
                  verified
                </span>
                <span>🏛️ Official Notice</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-heading text-[12px] font-semibold px-3 py-1 rounded-full border border-emerald-500/25">
                <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">
                  diversity_3
                </span>
                <span>🌱 Student Submission</span>
              </span>
            )}

            {/* Category Badge */}
            <span className="font-heading text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-surface-container text-on-surface-variant border border-outline-variant/30">
              {item.category}
            </span>

            {/* Organizer or Dept signature */}
            {item.organizer && (
              <span className="font-sans text-[12px] text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  {isOfficial ? 'apartment' : 'person'}
                </span>
                <span className="font-medium text-on-surface-variant truncate max-w-[200px] sm:max-w-[260px]">
                  {item.organizer}
                </span>
              </span>
            )}
          </div>

          {/* Right Action Buttons: Save & Admin Delete */}
          <div className="flex items-center gap-1.5">
            {canDelete && (
              <button
                onClick={() => onDelete(item.id, item.title)}
                className="p-1.5 text-outline hover:text-error hover:bg-error-container/20 rounded-xl transition-all"
                title="Delete update"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            )}

            <button
              onClick={handleSaveClick}
              disabled={saveLoading}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-heading text-[12px] font-medium transition-all ${
                savedLocal
                  ? 'bg-primary-container text-on-primary-container border border-primary/30'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/20'
              }`}
              title={savedLocal ? 'Remove from Saved' : 'Save for later'}
            >
              <span
                className={`material-symbols-outlined text-[17px] ${
                  savedLocal ? 'fill-1 text-primary' : ''
                }`}
              >
                bookmark
              </span>
              <span className="hidden sm:inline">
                {savedLocal ? 'Saved' : 'Save'}
              </span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 className="font-heading text-headline-sm font-bold text-on-surface leading-snug">
          {item.title}
        </h2>

        {/* Meta Bar: Deadline & Venue */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-body-sm text-on-surface-variant">
          {deadlineStatus && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-heading text-[12px] font-medium border ${
                deadlineStatus.urgency === 'critical'
                  ? 'bg-error-container/30 text-error border-error/30 animate-pulse'
                  : deadlineStatus.urgency === 'warning'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  : deadlineStatus.urgency === 'past'
                  ? 'bg-surface-container text-outline border-outline-variant/30 line-through'
                  : 'bg-primary-container/20 text-primary border-primary/20'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {deadlineStatus.urgency === 'critical' ? 'alarm' : 'event'}
              </span>
              <span>
                <strong className="font-semibold">Deadline:</strong>{' '}
                {deadlineStatus.text}
              </span>
            </div>
          )}

          {item.venue && (
            <div className="inline-flex items-center gap-1 font-sans text-[13px] text-outline">
              <span className="material-symbols-outlined text-[16px] text-primary">
                location_on
              </span>
              <span>{item.venue}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="font-sans text-body-md text-on-surface-variant leading-relaxed mt-1">
          <p className={`${isExpanded ? '' : 'line-clamp-3'}`}>
            {item.description}
          </p>
          {item.description.length > 220 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary font-heading text-[12px] font-semibold hover:underline mt-1"
            >
              {isExpanded ? 'Show less' : 'Read full notice'}
            </button>
          )}
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {item.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick && onTagClick(tag)}
                className="bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-primary font-heading text-[11px] font-medium px-2.5 py-0.5 rounded-full transition-colors border border-outline-variant/20"
              >
                #{tag.replace(/^#/, '')}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Bar: Distinct Author / Say Hi / Links */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-container/70 mt-auto flex-wrap gap-3">
          {/* Left: Author Identity */}
          {isOfficial ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[15px]">school</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-[12px] font-semibold text-on-surface">
                  Malaviya National Institute of Technology
                </span>
                <span className="font-sans text-[11px] text-outline">
                  Department of Computer Science &amp; Engineering
                </span>
              </div>
            </div>
          ) : (
            /* Student-submitted author card with SAY HI */
            item.author && (
              <div className="flex items-center gap-3">
                <Link
                  to={`/profile/${item.author.id}`}
                  className="flex items-center gap-2 group"
                >
                  <img
                    src={
                      item.author.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${item.author.name}`
                    }
                    alt={item.author.name}
                    className="w-8 h-8 rounded-full object-cover border border-outline-variant/40 group-hover:ring-2 ring-primary/40 transition-all"
                  />
                  <div className="flex flex-col">
                    <span className="font-heading text-[12px] font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1">
                      {item.author.name}
                      {item.author.role === 'admin' && (
                        <span className="material-symbols-outlined text-[13px] text-primary fill-1">
                          verified
                        </span>
                      )}
                    </span>
                    <span className="font-sans text-[11px] text-outline">
                      {item.author.rollNumber} {item.author.hostel ? `• ${item.author.hostel}` : ''}
                    </span>
                  </div>
                </Link>

                {/* Friendly Say Hi Button (No Connect Button!) */}
                {currentUser?.id !== item.author.id && (
                  <button
                    onClick={() => onSayHi && onSayHi(item.author)}
                    className="inline-flex items-center gap-1 bg-secondary-container/70 hover:bg-secondary-container text-on-secondary-container font-heading text-[12px] font-semibold px-2.5 py-1 rounded-xl transition-all shadow-2xs hover:scale-[1.02]"
                    title={`Say Hi to ${item.author.name}`}
                  >
                    <span>👋</span>
                    <span>Say Hi</span>
                  </button>
                )}
              </div>
            )
          )}

          {/* Right: Calendar & External Link Actions */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              onClick={() => downloadIcsCalendar(item)}
              className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary font-heading text-[12px] font-semibold px-2.5 py-1 rounded-lg hover:bg-surface-container transition-all"
              title="Download calendar event file (.ics)"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
              <span>Add to Cal</span>
            </button>

            {item.linkUrl && (
              <a
                href={sanitizeUrl(item.linkUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-primary text-on-primary hover:bg-primary/90 font-heading text-[12px] font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all hover:scale-[1.02]"
              >
                <span>{isOfficial ? 'View Circular' : 'Apply / Register'}</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
