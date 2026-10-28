import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import SeniorCard from '../components/seniors/SeniorCard';
import OptInGuidanceModal from '../components/seniors/OptInGuidanceModal';
import GuidanceFaqSection from '../components/seniors/GuidanceFaqSection';
import SayHiModal from '../components/messages/SayHiModal';

export default function SeniorsPage() {
  const { currentUser } = useAuth();
  const seniorsListRef = useRef(null);

  // Guidance status of current user
  const [guidanceStatus, setGuidanceStatus] = useState(null);
  const [isOptInModalOpen, setIsOptInModalOpen] = useState(false);

  // Seniors list state
  const [seniors, setSeniors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [selectedYear, setSelectedYear] = useState('All');
  const [availableTopics, setAvailableTopics] = useState([]);

  // FAQs
  const [faqs, setFaqs] = useState([]);

  // Say Hi Modal
  const [sayHiSenior, setSayHiSenior] = useState(null);
  const [isSayHiOpen, setIsSayHiOpen] = useState(false);

  // Fetch current user's guidance status
  const fetchGuidanceStatus = async () => {
    try {
      const res = await fetch('/api/guidance/status', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setGuidanceStatus(data);
      }
    } catch (err) {
      console.warn('Could not fetch guidance status:', err);
    }
  };

  // Fetch all guidance topics
  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/guidance/topics', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.topics) {
        setAvailableTopics(['All Topics', ...data.topics]);
      }
    } catch (err) {
      console.warn('Could not fetch topics:', err);
    }
  };

  // Fetch FAQs
  const fetchFaqs = async () => {
    try {
      const res = await fetch('/api/guidance/faqs', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.faqs) {
        setFaqs(data.faqs);
      }
    } catch (err) {
      console.warn('Could not fetch FAQs:', err);
    }
  };

  // Fetch seniors / guidance providers
  const fetchSeniors = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const params = new URLSearchParams();
      if (selectedTopic && selectedTopic !== 'All Topics') {
        params.append('topic', selectedTopic);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await fetch(`/api/guidance/providers?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch senior mentors');
      }

      setSeniors(data.seniors || []);
    } catch (err) {
      console.error('Error fetching seniors:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, searchQuery]);

  useEffect(() => {
    fetchGuidanceStatus();
    fetchTopics();
    fetchFaqs();
  }, []);

  useEffect(() => {
    fetchSeniors();
  }, [fetchSeniors]);

  // Open Say Hi with guidance context
  const handleAskGuidance = (senior) => {
    const primaryTopic = senior.guidanceTopics?.[0] || 'academics and systems';
    const peerWithContext = {
      ...senior,
      tags: senior.guidanceTopics || [],
      skills: senior.guidanceTopics?.length ? senior.guidanceTopics : senior.skills,
      defaultGuidanceTopic: primaryTopic,
    };
    setSayHiSenior(peerWithContext);
    setIsSayHiOpen(true);
  };

  // Handle clicking a topic tag from SeniorCard or FAQs
  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    if (seniorsListRef.current) {
      seniorsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter seniors by year locally
  const filteredSeniors = seniors.filter((s) => {
    if (selectedYear === '4th') {
      return s.yearLabel?.includes('4th Year');
    }
    if (selectedYear === '3rd') {
      return s.yearLabel?.includes('3rd Year');
    }
    return true;
  });

  return (
    <div className="max-w-[1360px] mx-auto w-full px-space-md lg:px-space-xl py-space-md flex flex-col gap-space-lg">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md sm:p-space-lg rounded-3xl border border-outline-variant/30 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-heading text-title-xs uppercase tracking-wider text-primary font-bold">
              Peer Mentorship &amp; Senior Advice
            </span>
            <span className="bg-primary/10 text-primary text-[11px] font-heading font-bold px-2 py-0.5 rounded-full border border-primary/20">
              Verified 3rd &amp; 4th Year CSE Seniors
            </span>
          </div>
          <h1 className="font-heading text-headline-lg font-bold text-on-surface">
            Seniors &amp; Guidance
          </h1>
          <p className="font-sans text-body-md text-on-surface-variant max-w-2xl mt-1">
            Connect with 3rd and 4th-year seniors who have walked the same labs, cracked Nachos synchronization, and navigated department electives.
          </p>
        </div>

        {/* Senior Opt-In CTA (if user is 3rd or 4th year) */}
        {guidanceStatus?.isEligibleSenior && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsOptInModalOpen(true)}
              className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 font-heading text-label-md font-bold px-4 py-2.5 rounded-2xl shadow-xs transition-all hover:scale-[1.02] flex-1 md:flex-initial justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">
                {guidanceStatus.isGuidanceProvider ? 'edit_note' : 'volunteer_activism'}
              </span>
              <span>
                {guidanceStatus.isGuidanceProvider
                  ? 'Edit Guidance Profile'
                  : 'Opt In as Guidance Provider'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Senior Opt-in Banner for 3rd/4th years who haven't opted in yet */}
      {guidanceStatus?.isEligibleSenior && !guidanceStatus.isGuidanceProvider && (
        <div className="bg-gradient-to-r from-primary-container/30 via-tertiary-container/20 to-surface-container-lowest p-5 rounded-3xl border border-primary/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[22px]">handshake</span>
            </div>
            <div>
              <h3 className="font-heading text-title-md font-bold text-on-surface">
                You're in your {guidanceStatus.yearLabel?.split(' ')[0]} {guidanceStatus.yearLabel?.split(' ')[1]}!
              </h3>
              <p className="font-sans text-body-sm text-on-surface-variant mt-0.5">
                Juniors look up to your experience in Nachos OS labs, CP problem patterns, and electives. Opt in to list topics you can help with.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOptInModalOpen(true)}
            className="bg-primary text-on-primary hover:bg-primary/90 font-heading text-label-sm font-bold px-4 py-2 rounded-xl transition-all shadow-xs whitespace-nowrap"
          >
            List My Guidance Topics
          </button>
        </div>
      )}

      {/* Guidance Tracks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'CS204 Nachos OS Lab',
            desc: 'Thread state diagrams, context switches, synchronization primitives, and viva survival.',
            icon: 'terminal',
            topic: 'Nachos OS Lab',
            badge: 'High Demand',
          },
          {
            title: 'Competitive Programming',
            desc: 'Archetype-based practice: Sliding Window, DP on Trees, and avoiding off-by-one errors.',
            icon: 'code',
            topic: 'Competitive Programming',
            badge: 'Contest Prep',
          },
          {
            title: 'Open Source & Projects',
            desc: 'Building real depth: custom memory allocators, Raft consensus in Go, and GSoC proposals.',
            icon: 'hub',
            topic: 'Open Source & GSoC',
            badge: 'Engineering Depth',
          },
        ].map((track) => (
          <div
            key={track.title}
            className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">{track.icon}</span>
                </div>
                <span className="bg-surface-container text-on-surface-variant font-heading text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  {track.badge}
                </span>
              </div>
              <h3 className="font-heading text-title-md font-bold text-on-surface">
                {track.title}
              </h3>
              <p className="font-sans text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                {track.desc}
              </p>
            </div>

            <button
              onClick={() => handleSelectTopic(track.topic)}
              className="inline-flex items-center gap-1 text-primary hover:underline font-heading text-label-sm font-bold mt-4"
            >
              <span>Find Seniors for this Track</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>
        ))}
      </div>

      {/* Seniors Search & Filters Toolbar */}
      <div ref={seniorsListRef} className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-2xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-[20px] text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search seniors by name, topic, skills, hostel, or roll number..."
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-10 pr-9 py-2.5 font-sans text-body-md text-on-surface focus:outline-none focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Year Filter Buttons */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
            <button
              onClick={() => setSelectedYear('All')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-heading font-semibold transition-all ${
                selectedYear === 'All'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              All Seniors
            </button>
            <button
              onClick={() => setSelectedYear('4th')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-heading font-semibold transition-all ${
                selectedYear === '4th'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              4th Years
            </button>
            <button
              onClick={() => setSelectedYear('3rd')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-heading font-semibold transition-all ${
                selectedYear === '3rd'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              3rd Years
            </button>
          </div>
        </div>

        {/* Topic Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[12px]">
          <span className="font-heading text-outline font-semibold whitespace-nowrap mr-1">
            Filter by topic:
          </span>
          {availableTopics.map((topic) => {
            const isSelected = selectedTopic.toLowerCase() === topic.toLowerCase();
            return (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1 rounded-full font-heading font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/25'
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {/* Results stats */}
        <div className="flex items-center justify-between text-[12px] text-outline pt-2 border-t border-surface-container/60">
          <span>
            Showing <strong>{filteredSeniors.length}</strong> available guidance providers
            {selectedTopic !== 'All Topics' && (
              <> for topic: <strong>{selectedTopic}</strong></>
            )}
          </span>

          {(searchQuery || selectedTopic !== 'All Topics' || selectedYear !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTopic('All Topics');
                setSelectedYear('All');
              }}
              className="text-primary hover:underline font-heading font-semibold"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Seniors Grid */}
      {errorMsg ? (
        <div className="bg-error-container/30 border border-error/30 rounded-2xl p-6 text-center text-error flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[32px]">error</span>
          <p className="font-sans text-body-md">{errorMsg}</p>
          <button
            onClick={fetchSeniors}
            className="px-4 py-2 bg-error text-on-error font-heading text-label-md font-bold rounded-xl mt-2"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-outline">
          <span className="material-symbols-outlined text-[36px] animate-spin text-primary">
            progress_activity
          </span>
          <span className="font-heading text-label-md">Loading senior mentors...</span>
        </div>
      ) : filteredSeniors.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/30 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-[32px]">school</span>
          </div>
          <h3 className="font-heading text-headline-sm font-bold text-on-surface">
            No senior mentors found
          </h3>
          <p className="font-sans text-body-md text-on-surface-variant max-w-md">
            No 3rd or 4th-year seniors matched your selected topic or search keywords. Try clearing filters or searching for different topics like "Nachos" or "Competitive Programming".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTopic('All Topics');
              setSelectedYear('All');
            }}
            className="px-4 py-2 bg-primary text-on-primary font-heading text-label-md font-bold rounded-xl mt-2"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSeniors.map((senior) => (
            <SeniorCard
              key={senior.id}
              senior={senior}
              currentUser={currentUser}
              onAskGuidance={handleAskGuidance}
              onTopicClick={handleSelectTopic}
            />
          ))}
        </div>
      )}

      {/* "Questions students often ask" Section */}
      <GuidanceFaqSection
        faqs={faqs}
        onAskAboutTopic={handleSelectTopic}
      />

      {/* Opt-In Modal (for 3rd and 4th-year students) */}
      <OptInGuidanceModal
        isOpen={isOptInModalOpen}
        onClose={() => setIsOptInModalOpen(false)}
        currentStatus={guidanceStatus}
        onUpdated={(newProfile) => {
          setGuidanceStatus((prev) => ({
            ...prev,
            isGuidanceProvider: newProfile.isGuidanceProvider,
            guidanceTopics: newProfile.guidanceTopics || [],
            guidanceBio: newProfile.guidanceBio || '',
            guidanceAvailability: newProfile.guidanceAvailability || '',
          }));
          fetchSeniors();
        }}
      />

      {/* Say Hi Modal for Asking Guidance */}
      <SayHiModal
        peer={sayHiSenior}
        isOpen={isSayHiOpen}
        onClose={() => {
          setIsSayHiOpen(false);
          setSayHiSenior(null);
        }}
        onSuccess={() => {
          setIsSayHiOpen(false);
          setSayHiSenior(null);
        }}
      />
    </div>
  );
}
