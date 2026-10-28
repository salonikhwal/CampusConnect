import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_INTERESTS = [
  'Systems Programming',
  'Nachos OS & Kernels',
  'AI / Machine Learning',
  'Fullstack & Web Dev',
  'Competitive Programming',
  'Computer Networks',
  'Cybersecurity & Crypto',
  'Cloud & DevOps',
  'Database Internals',
  'Open Source Software',
];

const AVAILABLE_SKILLS = [
  'C / C++',
  'Python',
  'Rust',
  'Go',
  'Java',
  'TypeScript',
  'React',
  'Linux Kernel',
  'Docker',
  'Nachos OS',
  'PostgreSQL',
  'Git / GitHub',
];

const AVAILABLE_OPEN_TO = [
  { id: 'chai', label: '☕ Chai at Prabha Bhawan', desc: 'Casual campus break & brainstorming' },
  { id: 'nachos', label: '💻 Nachos OS Lab Viva Prep', desc: 'Mock viva practice for CS204' },
  { id: 'hackathon', label: '🚀 Sphinx Hackathon Teaming', desc: 'Building innovative projects together' },
  { id: 'canteen', label: '🌙 Late Night Canteen Drill', desc: 'Night owl coding & tea runs' },
  { id: 'code_review', label: '🔍 Peer Code Review & Debug', desc: 'Looking over assignments & PRs' },
  { id: 'cp_practice', label: '🏆 CP / Contest Practice', desc: 'Codeforces & LeetCode drills' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { currentUser, updateOnboarding } = useAuth();

  const [step, setStep] = useState(1); // 1: Identity & Batch, 2: Interests & Skills, 3: Open To & Lab
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [batchYear, setBatchYear] = useState(2027);
  const [hostel, setHostel] = useState('Hostel 4 Kaveri');
  const [roomNo, setRoomNo] = useState('');
  const [labGroup, setLabGroup] = useState('CC-03');
  const [bio, setBio] = useState('');

  const [selectedInterests, setSelectedInterests] = useState([
    'Systems Programming',
    'Nachos OS & Kernels',
    'AI / Machine Learning',
  ]);
  const [selectedSkills, setSelectedSkills] = useState(['C / C++', 'Python', 'Linux Kernel']);
  const [selectedOpenTo, setSelectedOpenTo] = useState([
    '☕ Chai at Prabha Bhawan',
    '💻 Nachos OS Lab Viva Prep',
    '🚀 Sphinx Hackathon Teaming',
  ]);

  // Prepopulate if user already has data
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.batchYear) setBatchYear(currentUser.batchYear);
      if (currentUser.hostel) setHostel(currentUser.hostel);
      if (currentUser.roomNo) setRoomNo(currentUser.roomNo);
      if (currentUser.labGroup) setLabGroup(currentUser.labGroup);
      if (currentUser.bio) setBio(currentUser.bio);
    }
  }, [currentUser]);

  // Toggle helpers
  const toggleInterest = (item) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleSkill = (item) => {
    setSelectedSkills((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const toggleOpenTo = (label) => {
    setSelectedOpenTo((prev) =>
      prev.includes(label) ? prev.filter((o) => o !== label) : [...prev, label]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await updateOnboarding({
        name: name.trim() || currentUser?.name || 'Student',
        batchYear: parseInt(batchYear, 10),
        interests: selectedInterests,
        skills: selectedSkills,
        openTo: selectedOpenTo,
        hostel: hostel.trim(),
        roomNo: roomNo.trim(),
        labGroup: labGroup.trim(),
        bio: bio.trim(),
      });

      if (res.success) {
        navigate('/', { replace: true });
      } else {
        setErrorMsg(res.error || 'Failed to complete profile onboarding.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        
        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-label-sm font-heading font-semibold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[16px]">badge</span>
            <span>MNIT CSE • Student Setup</span>
          </div>
          <h1 className="font-heading text-headline-md text-on-surface font-bold tracking-tight">
            Complete Your Commons Profile
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-1">
            CampusConnect is designed for low-pressure collaboration. Let your peers know your interests and viva drills.
          </p>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[
            { num: 1, title: 'Identity & Batch' },
            { num: 2, title: 'Interests & Skills' },
            { num: 3, title: 'Open To & Labs' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-heading text-xs font-semibold transition-all ${
                  step === s.num
                    ? 'bg-primary text-on-primary shadow-sm ring-4 ring-primary/20'
                    : step > s.num
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container text-outline'
                }`}
              >
                {step > s.num ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : (
                  s.num
                )}
              </div>
              <span className={`text-label-sm font-heading hidden sm:inline ${
                step === s.num ? 'font-bold text-on-surface' : 'text-on-surface-variant'
              }`}>
                {s.title}
              </span>
              {s.num < 3 && <div className="w-6 h-0.5 bg-surface-container-high hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2 text-error">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">error</span>
            <p className="text-body-sm">{errorMsg}</p>
          </div>
        )}

        {/* Card Content */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-outline-variant/30 p-space-lg sm:p-space-xl">
          
          {/* STEP 1: Identity & Batch */}
          {step === 1 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div>
                <h2 className="font-heading text-headline-sm text-on-surface font-bold">
                  Step 1: Identity &amp; Batch
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Confirm your name and graduating cohort at MNIT Jaipur.
                </p>
              </div>

              <div>
                <label className="block font-heading text-label-md text-on-surface font-semibold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
                />
              </div>

              <div>
                <label className="block font-heading text-label-md text-on-surface font-semibold mb-2">
                  Graduating Batch (Year)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { year: 2028, cohort: 'Class of 2028', label: "1st Year ('28)" },
                    { year: 2027, cohort: 'Class of 2027', label: "2nd Year ('27)" },
                    { year: 2026, cohort: 'Class of 2026', label: "3rd Year ('26)" },
                    { year: 2025, cohort: 'Class of 2025', label: "Final Year ('25)" },
                  ].map((item) => (
                    <button
                      key={item.year}
                      type="button"
                      onClick={() => setBatchYear(item.year)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        batchYear === item.year
                          ? 'border-primary bg-primary-fixed/40 text-on-primary-fixed shadow-xs'
                          : 'border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="font-heading font-bold text-label-lg">{item.label}</div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">{item.cohort}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-label-md text-on-surface font-semibold mb-1">
                    Hostel &amp; Room
                  </label>
                  <input
                    type="text"
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    placeholder="e.g. Hostel 4 Kaveri"
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-heading text-label-md text-on-surface font-semibold mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    placeholder="e.g. 218"
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!name.trim()) {
                      setErrorMsg('Please enter your full name before continuing.');
                      return;
                    }
                    setErrorMsg('');
                    setStep(2);
                  }}
                  className="py-2.5 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading font-semibold text-label-md flex items-center gap-2 shadow-xs transition-colors"
                >
                  <span>Continue to Interests &amp; Skills</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Interests & Skills */}
          {step === 2 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div>
                <h2 className="font-heading text-headline-sm text-on-surface font-bold">
                  Step 2: Technical Interests &amp; Skills
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Select what domains you enjoy and your current programming toolkit.
                </p>
              </div>

              {/* Interests */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-heading text-label-md text-on-surface font-semibold">
                    Core Interests ({selectedInterests.length} selected)
                  </label>
                  <span className="text-[11px] text-outline">Click to toggle</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_INTERESTS.map((item) => {
                    const isSelected = selectedInterests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInterest(item)}
                        className={`px-3 py-1.5 rounded-full text-label-sm font-heading font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                        }`}
                      >
                        {item} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-heading text-label-md text-on-surface font-semibold">
                    Technical Skills ({selectedSkills.length} selected)
                  </label>
                  <span className="text-[11px] text-outline">Languages &amp; Tools</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-code-sm transition-all ${
                          isSelected
                            ? 'bg-secondary text-on-secondary shadow-xs'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                        }`}
                      >
                        {skill} {isSelected ? '●' : '○'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-xl border border-outline-variant text-on-surface font-heading font-medium text-label-md hover:bg-surface-container transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="py-2.5 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading font-semibold text-label-md flex items-center gap-2 shadow-xs transition-colors"
                >
                  <span>Continue to Collaboration</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: What You're Open To & Finish */}
          {step === 3 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div>
                <h2 className="font-heading text-headline-sm text-on-surface font-bold">
                  Step 3: What You're Open To
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Pick the low-pressure campus activities and peer collaborations you welcome.
                </p>
              </div>

              {/* Open To Options */}
              <div className="flex flex-col gap-2.5">
                {AVAILABLE_OPEN_TO.map((item) => {
                  const isChecked = selectedOpenTo.includes(item.label);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleOpenTo(item.label)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'border-primary bg-primary-fixed/30 text-on-surface'
                          : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-heading font-semibold text-label-md text-on-surface">
                          {item.label}
                        </span>
                        <span className="text-[12px] text-on-surface-variant">{item.desc}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-primary border-primary text-on-primary'
                            : 'border-outline text-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Lab Group & Bio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-heading text-label-md text-on-surface font-semibold mb-1">
                    Lab Slot / Batch
                  </label>
                  <input
                    type="text"
                    value={labGroup}
                    onChange={(e) => setLabGroup(e.target.value)}
                    placeholder="CC-03"
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm uppercase font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-heading text-label-md text-on-surface font-semibold mb-1">
                    Short Campus Note / Bio
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. 3rd Sem • Nachos OS viva prep • Prabha Bhawan regular"
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 px-4 rounded-xl border border-outline-variant text-on-surface font-heading font-medium text-label-md hover:bg-surface-container transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinish}
                  className="py-3 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading font-semibold text-label-lg flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                      <span>Finish Setup &amp; Enter Commons</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
