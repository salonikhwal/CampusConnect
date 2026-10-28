import React from 'react';
import { Link } from 'react-router-dom';

export default function SeniorCard({
  senior,
  currentUser,
  onAskGuidance,
  onTopicClick,
}) {
  const isSelf = senior.id === currentUser?.id;
  const is4thYear = senior.yearLabel?.includes('4th Year');

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 border border-outline-variant/35 shadow-2xs hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
      {/* Top Subtle Year Strip */}
      <div
        className={`h-1.5 w-full absolute top-0 left-0 ${
          is4thYear
            ? 'bg-gradient-to-r from-primary via-tertiary to-primary-container'
            : 'bg-gradient-to-r from-secondary via-secondary-container to-tertiary'
        }`}
      />

      <div>
        {/* Senior Header Bar */}
        <div className="flex items-start justify-between gap-3 mb-3 pt-1">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${senior.id}`} className="relative flex-shrink-0">
              <img
                src={
                  senior.avatarUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${senior.name}`
                }
                alt={senior.name}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-surface-container shadow-2xs group-hover:ring-2 ring-primary/40 transition-all"
              />
              <span
                className={`w-3.5 h-3.5 rounded-full absolute -bottom-1 -right-1 border-2 border-surface-container-lowest ${
                  senior.guidanceAvailability ? 'bg-emerald-500' : 'bg-primary'
                }`}
                title="Guidance Provider Active"
              />
            </Link>

            <div>
              <Link
                to={`/profile/${senior.id}`}
                className="font-heading text-title-md font-bold text-on-surface hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <span>{senior.name}</span>
                <span className="material-symbols-outlined text-[16px] text-primary fill-1" title="Senior Mentor">
                  verified
                </span>
              </Link>

              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span
                  className={`font-heading text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    is4thYear
                      ? 'bg-primary/10 text-primary border border-primary/25'
                      : 'bg-secondary/10 text-secondary border border-secondary/25'
                  }`}
                >
                  {senior.yearLabel}
                </span>

                {senior.hostel && (
                  <span className="font-sans text-[12px] text-outline flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[14px]">home</span>
                    <span>{senior.hostel} {senior.roomNo ? `• ${senior.roomNo}` : ''}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Guidance Bio */}
        {senior.guidanceBio ? (
          <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed mb-3 bg-surface-container-low/40 p-3 rounded-2xl border border-outline-variant/20">
            "{senior.guidanceBio}"
          </p>
        ) : senior.bio ? (
          <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed mb-3">
            {senior.bio}
          </p>
        ) : null}

        {/* Guidance Topics */}
        {senior.guidanceTopics && senior.guidanceTopics.length > 0 && (
          <div className="mb-3.5">
            <span className="text-[11px] font-heading font-semibold text-outline uppercase tracking-wider block mb-1.5">
              Helps juniors with:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {senior.guidanceTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => onTopicClick && onTopicClick(topic)}
                  className="bg-primary-container/25 text-primary hover:bg-primary hover:text-on-primary font-heading text-[11px] font-semibold px-2.5 py-0.8 rounded-xl border border-primary/20 transition-all shadow-2xs"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Availability / Office Hours */}
        {senior.guidanceAvailability && (
          <div className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20 mb-4 text-[12px] flex items-start gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0 mt-0.5">
              schedule
            </span>
            <div>
              <strong className="font-heading font-semibold text-on-surface block">
                Office Hours / When to reach out:
              </strong>
              <span className="font-sans text-[11.5px] leading-tight text-on-surface-variant">
                {senior.guidanceAvailability}
              </span>
            </div>
          </div>
        )}

        {/* Skills Preview */}
        {senior.skills && senior.skills.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-4 text-[11px] text-outline">
            <span className="font-heading font-medium">Stack:</span>
            {senior.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-2 mt-auto">
        <Link
          to={`/profile/${senior.id}`}
          className="text-on-surface-variant hover:text-primary font-heading text-[12px] font-semibold transition-colors px-2 py-1"
        >
          View Profile
        </Link>

        {isSelf ? (
          <span className="bg-surface-container text-on-surface-variant font-heading text-[12px] font-semibold px-3 py-1.5 rounded-xl">
            You (Guidance Provider)
          </span>
        ) : (
          <button
            onClick={() => onAskGuidance && onAskGuidance(senior)}
            className="inline-flex items-center gap-1.5 bg-primary text-on-primary hover:bg-primary/90 font-heading text-label-sm font-bold px-4 py-2 rounded-2xl shadow-xs transition-all hover:scale-[1.02]"
            title={`Ask for guidance from ${senior.name}`}
          >
            <span>👋</span>
            <span>Ask for Guidance</span>
          </button>
        )}
      </div>
    </div>
  );
}
