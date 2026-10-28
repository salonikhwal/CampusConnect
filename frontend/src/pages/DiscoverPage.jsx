import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SayHiModal from '../components/messages/SayHiModal';

const batchOptions = [
  'All Batches',
  "1st Year '28",
  "2nd Year '27",
  "3rd Year '26",
  "Final Year '25",
];

const interestOptions = [
  'All Interests',
  'Systems & OS',
  'Web Development',
  'DSA & CP',
  'Distributed Systems',
  'Algorithms',
  'AI/ML',
  'UI/UX Design',
  'Open Source',
];

const skillOptions = [
  'All Skills',
  'C/C++',
  'Python',
  'React',
  'Linux',
  'Go',
  'TypeScript',
  'Git',
  'Docker',
];

const openToOptions = [
  'All Collaboration',
  'Chai at Prabha Bhawan',
  'Sphinx Hackathon Team',
  'Lab Study Partner',
  'Midsem / Endsem Study Sessions',
  'Nachos OS Lab Viva Prep',
];

export default function DiscoverPage() {
  const navigate = useNavigate();

  // Filters State
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [selectedInterest, setSelectedInterest] = useState('All Interests');
  const [selectedSkill, setSelectedSkill] = useState('All Skills');
  const [selectedOpenTo, setSelectedOpenTo] = useState('All Collaboration');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [peers, setPeers] = useState([]);
  const [similarPeers, setSimilarPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Say Hi Modal
  const [sayHiPeer, setSayHiPeer] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return 'CC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Fetch peers from backend
  const fetchDiscover = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedBatch !== 'All Batches') params.append('year', selectedBatch);
      if (selectedInterest !== 'All Interests') params.append('interest', selectedInterest);
      if (selectedSkill !== 'All Skills') params.append('skill', selectedSkill);
      if (selectedOpenTo !== 'All Collaboration') params.append('openTo', selectedOpenTo);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/users/discover?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load classmates directory');
      }
      const data = await res.json();
      setPeers(data.peers || []);
      setSimilarPeers(data.similarPeers || []);
    } catch (err) {
      console.error('Discover fetch error:', err);
      setError(err.message || 'Unable to connect to campus directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscover();
  }, [selectedBatch, selectedInterest, selectedSkill, selectedOpenTo]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscover();
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const hasActiveFilters =
    selectedBatch !== 'All Batches' ||
    selectedInterest !== 'All Interests' ||
    selectedSkill !== 'All Skills' ||
    selectedOpenTo !== 'All Collaboration' ||
    Boolean(searchQuery.trim());

  const handleResetFilters = () => {
    setSelectedBatch('All Batches');
    setSelectedInterest('All Interests');
    setSelectedSkill('All Skills');
    setSelectedOpenTo('All Collaboration');
    setSearchQuery('');
  };

  return (
    <div className="max-w-[1360px] mx-auto w-full px-space-md lg:px-space-xl py-space-md">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface py-2.5 px-4 rounded-xl shadow-lg font-heading text-label-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-space-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
          <div>
            <h1 className="font-heading text-headline-lg font-bold text-on-surface tracking-tight">
              Discover Classmates &amp; Peers
            </h1>
            <p className="font-sans text-body-md text-on-surface-variant mt-1 max-w-3xl">
              MNIT CSE digital commons directory. Connect for lab viva prep, sphinx hackathons, or evening chai without transactional friend requests, popularity metrics, or algorithmic rankings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-heading text-label-sm font-medium border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
              <span>{peers.length} Students Listed</span>
            </span>
          </div>
        </div>
      </div>

      {/* Comprehensive Filter and Search Bar */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-xs border border-outline-variant/30 mb-space-lg flex flex-col gap-space-sm">
        {/* Top Search & Reset Row */}
        <div className="flex flex-col sm:flex-row items-center gap-space-sm justify-between">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, roll no, tech, or hostel..."
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm pl-9 pr-3 py-2 rounded-xl border border-outline-variant/20 focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-primary hover:underline font-heading text-label-sm font-semibold flex items-center gap-1 self-end sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Reset all filters
            </button>
          )}
        </div>

        {/* Dropdowns Row: Interests, Skills, Looking For */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-surface-container/60">
          {/* Interests Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-heading text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Filter by Interest:
            </label>
            <select
              value={selectedInterest}
              onChange={(e) => setSelectedInterest(e.target.value)}
              className="bg-surface-container-low text-on-surface font-sans text-body-sm px-3 py-1.5 rounded-xl border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {interestOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Skills Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-heading text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Filter by Skill / Tech:
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="bg-surface-container-low text-on-surface font-sans text-body-sm px-3 py-1.5 rounded-xl border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {skillOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Looking For / Open To Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-heading text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              "Looking For" / Open To:
            </label>
            <select
              value={selectedOpenTo}
              onChange={(e) => setSelectedOpenTo(e.target.value)}
              className="bg-surface-container-low text-on-surface font-sans text-body-sm px-3 py-1.5 rounded-xl border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {openToOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch Year Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 border-t border-surface-container/60 pt-2">
          <span className="font-heading text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mr-1 flex-shrink-0">
            Batch:
          </span>
          {batchOptions.map((batch) => (
            <button
              key={batch}
              onClick={() => setSelectedBatch(batch)}
              className={`px-3 py-1 rounded-full font-heading text-label-sm whitespace-nowrap transition-all ${
                selectedBatch === batch
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {batch}
            </button>
          ))}
        </div>
      </div>

      {/* "Similar Interests" Section (Strictly NO match percentages!) */}
      {similarPeers.length > 0 && !hasActiveFilters && (
        <div className="mb-space-lg bg-surface-container-low/40 rounded-2xl p-space-md border border-outline-variant/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm border-b border-surface-container/60 mb-space-md gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">hub</span>
              <div>
                <h2 className="font-heading text-title-md font-bold text-on-surface">
                  Classmates with Overlapping Interests
                </h2>
                <p className="font-sans text-body-xs text-on-surface-variant">
                  Peers who share technical interests and campus collaboration goals with you. No percentage ranking scores.
                </p>
              </div>
            </div>
            <span className="text-body-xs font-sans text-outline self-start sm:self-auto">
              Natural Peer Alignment
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {similarPeers.map((peer) => (
              <div
                key={`similar-${peer.id}`}
                className="bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant/30 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div 
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => navigate(`/profile/${peer.rollNumber || peer.id}`)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-fixed to-secondary-fixed flex items-center justify-center font-heading font-bold text-on-primary-fixed-variant text-sm shadow-2xs group-hover:scale-105 transition-transform">
                        {getInitials(peer.name)}
                      </div>
                      <div>
                        <h4 className="font-heading text-label-md font-bold text-on-surface group-hover:text-primary transition-colors">
                          {peer.name}
                        </h4>
                        <span className="text-[11px] font-heading text-on-surface-variant">
                          {peer.batch}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSayHiPeer(peer)}
                      disabled={peer.isAwaitingReply}
                      className={`text-label-xs font-heading font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                        peer.isAwaitingReply
                          ? 'bg-surface-container text-outline cursor-not-allowed'
                          : 'bg-primary-fixed/60 hover:bg-primary-fixed text-primary'
                      }`}
                      title={peer.isAwaitingReply ? 'Awaiting reply' : 'Say Hi'}
                    >
                      <span>👋</span>
                      <span>{peer.isAwaitingReply ? 'Awaiting' : 'Say Hi'}</span>
                    </button>
                  </div>

                  {/* Shared Topics Badges (NO PERCENTAGES) */}
                  <div className="p-2 rounded-lg bg-surface-container-low/60 border border-outline-variant/20 mb-2">
                    <span className="text-[10px] font-heading font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Shared with you:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {peer.sharedInterests.map((interest) => (
                        <span
                          key={interest}
                          className="bg-primary-fixed/30 text-on-primary-fixed-variant font-heading text-[10px] px-1.5 py-0.5 rounded font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                      {peer.sharedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-secondary-fixed/40 text-on-secondary-fixed-variant font-heading text-[10px] px-1.5 py-0.5 rounded font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/profile/${peer.rollNumber || peer.id}`)}
                  className="w-full text-center py-1 font-heading text-label-xs text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1"
                >
                  <span>View Commons Profile</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Peers Directory */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-title-md font-bold text-on-surface">
          {hasActiveFilters ? 'Filtered Classmates' : 'All Computer Science Peers'}
        </h3>
        <span className="font-sans text-body-xs text-on-surface-variant">
          Showing {peers.length} {peers.length === 1 ? 'classmate' : 'classmates'}
        </span>
      </div>

      {loading ? (
        <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            progress_activity
          </span>
          <p className="font-heading text-label-md text-on-surface-variant">
            Loading campus directory...
          </p>
        </div>
      ) : error ? (
        <div className="py-12 p-6 rounded-2xl bg-surface-container-lowest border border-error/30 text-center flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-3xl text-error">error</span>
          <h4 className="font-heading text-title-sm font-bold text-on-surface">Directory Unavailable</h4>
          <p className="font-sans text-body-sm text-on-surface-variant">{error}</p>
          <button
            onClick={fetchDiscover}
            className="mt-2 px-4 py-1.5 rounded-xl bg-primary text-on-primary font-heading text-label-sm font-semibold"
          >
            Retry
          </button>
        </div>
      ) : peers.length === 0 ? (
        <div className="py-16 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-4xl text-outline">group_off</span>
          <h4 className="font-heading text-title-sm font-bold text-on-surface">No Classmates Match Current Filters</h4>
          <p className="font-sans text-body-sm text-on-surface-variant max-w-md">
            Try resetting your search query or selecting "All Batches" and "All Interests" to explore more students.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-3 px-4 py-2 rounded-xl bg-primary text-on-primary font-heading text-label-sm font-semibold shadow-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {peers.map((peer) => (
            <div
              key={peer.id}
              className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/30 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name, Batch */}
                <div className="flex items-start justify-between gap-space-sm mb-2">
                  <div 
                    className="flex items-center gap-space-sm cursor-pointer group flex-1 min-w-0"
                    onClick={() => navigate(`/profile/${peer.rollNumber || peer.id}`)}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-fixed to-secondary-fixed flex items-center justify-center font-heading font-bold text-on-primary-fixed-variant text-base shadow-2xs group-hover:scale-105 transition-transform">
                        {getInitials(peer.name)}
                      </div>
                      {peer.isAvailable && (
                        <span 
                          className="absolute bottom-0 right-0 w-3 h-3 bg-secondary-container rounded-full ring-2 ring-surface-container-lowest" 
                          title="Active on campus" 
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-label-lg font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                        {peer.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="bg-surface-container text-on-surface-variant font-heading text-label-xs px-2 py-0.5 rounded-full font-medium inline-block">
                          {peer.batch}
                        </span>
                        <span className="font-heading text-label-xs text-outline">
                          {peer.rollNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campus Location / Hostel */}
                <div className="flex items-center gap-1.5 text-on-surface-variant font-sans text-body-sm mb-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">apartment</span>
                  <span>
                    {peer.hostel}
                    {peer.roomNo ? ` • Room ${peer.roomNo}` : peer.roomHidden ? ' • Room Hidden' : ''}
                  </span>
                </div>

                {/* Bio / About */}
                <p className="font-sans text-body-sm text-on-surface-variant line-clamp-2 mb-3">
                  {peer.bio || 'MNIT CSE student exploring technology and campus life.'}
                </p>

                {/* Currently Learning Card */}
                {peer.currentlyLearning && (
                  <div className="p-2 rounded-xl bg-surface-container-low/70 border border-outline-variant/20 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                    <p className="font-sans text-body-xs text-on-surface truncate">
                      <span className="font-heading font-semibold text-primary">Learning: </span>
                      {peer.currentlyLearning}
                    </p>
                  </div>
                )}

                {/* Technical Skills */}
                {peer.skills && peer.skills.length > 0 && (
                  <div className="mb-2.5">
                    <div className="flex flex-wrap gap-1">
                      {peer.skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="bg-surface-container-low text-primary font-heading text-[11px] px-2 py-0.5 rounded-md font-medium"
                        >
                          #{skill}
                        </span>
                      ))}
                      {peer.skills.length > 5 && (
                        <span className="text-outline text-[11px] px-1 py-0.5 font-heading">
                          +{peer.skills.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Open To Collaboration Chips */}
                {peer.openTo && peer.openTo.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {peer.openTo.slice(0, 2).map((item) => (
                        <span
                          key={item}
                          className="bg-surface-container-high/60 text-on-surface-variant font-heading text-[10px] px-2 py-0.5 rounded-full"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions: Profile & Say Hi (Strictly NO Connect button!) */}
              <div className="pt-space-sm border-t border-surface-container/60 flex items-center justify-between gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${peer.rollNumber || peer.id}`)}
                  className="text-on-surface-variant hover:text-primary font-heading text-label-sm px-2.5 py-1.5 rounded-lg hover:bg-surface-container transition-colors inline-flex items-center gap-1"
                >
                  <span>Profile</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {peer.isAwaitingReply ? (
                    <span 
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant font-heading text-label-sm border border-outline-variant/30"
                      title="You already sent a starter note. Awaiting their reply."
                    >
                      <span>⏳</span>
                      <span>Awaiting Reply</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSayHiPeer(peer)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-primary-fixed/70 hover:bg-primary-fixed text-primary font-heading text-label-sm font-semibold transition-all shadow-2xs"
                    >
                      <span className="text-[14px]">👋</span>
                      <span>Say Hi</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Say Hi Modal */}
      <SayHiModal
        peer={sayHiPeer}
        isOpen={Boolean(sayHiPeer)}
        onClose={() => setSayHiPeer(null)}
        onSuccess={(conversation, message) => {
          showToast(`Note dispatched to ${sayHiPeer?.name}!`);
          fetchDiscover();
        }}
      />
    </div>
  );
}
