import React, { useState } from 'react';
import { sanitizeUrl } from '../../utils/sanitizeUrl';

export default function EditProfileModal({ isOpen, onClose, profile, onProfileUpdated }) {
  if (!isOpen || !profile) return null;

  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'learning' | 'projects' | 'privacy'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState(profile.name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [about, setAbout] = useState(profile.about || '');
  const [currentlyLearning, setCurrentlyLearning] = useState(profile.currentlyLearning || '');
  const [hostel, setHostel] = useState(profile.hostel || 'Hostel 4 (Kaveri)');
  const [roomNo, setRoomNo] = useState(profile.roomNo || '');
  const [labGroup, setLabGroup] = useState(profile.labGroup || 'CC-03');
  const [phone, setPhone] = useState(profile.phone || '');

  // Interests & Skills
  const [interests, setInterests] = useState(profile.interests || []);
  const [newInterest, setNewInterest] = useState('');

  const [skills, setSkills] = useState(profile.skills || []);
  const [newSkill, setNewSkill] = useState('');

  const [openTo, setOpenTo] = useState(profile.openTo || []);
  const [newOpenTo, setNewOpenTo] = useState('');

  // Projects
  const [projects, setProjects] = useState(
    Array.isArray(profile.projects) ? profile.projects : []
  );
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    techStack: '',
    githubUrl: '',
    liveUrl: '',
  });
  const [showAddProject, setShowAddProject] = useState(false);

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    showContactDetails: profile.privacySettings?.showContactDetails ?? false,
    showRoomNumber: profile.privacySettings?.showRoomNumber ?? true,
    allowDirectHi: profile.privacySettings?.allowDirectHi ?? true,
    showSchedule: profile.privacySettings?.showSchedule ?? true,
  });

  // Chip helpers
  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (item) => {
    setInterests(interests.filter((i) => i !== item));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (item) => {
    setSkills(skills.filter((s) => s !== item));
  };

  const addOpenTo = () => {
    if (newOpenTo.trim() && !openTo.includes(newOpenTo.trim())) {
      setOpenTo([...openTo, newOpenTo.trim()]);
      setNewOpenTo('');
    }
  };

  const removeOpenTo = (item) => {
    setOpenTo(openTo.filter((o) => o !== item));
  };

  // Project helpers
  const handleAddProject = () => {
    if (!projectForm.title.trim()) return;
    const newProj = {
      id: `proj-${Date.now()}`,
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      techStack: projectForm.techStack
        ? projectForm.techStack.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      githubUrl: projectForm.githubUrl.trim(),
      liveUrl: projectForm.liveUrl.trim(),
    };
    setProjects([...projects, newProj]);
    setProjectForm({ title: '', description: '', techStack: '', githubUrl: '', liveUrl: '' });
    setShowAddProject(false);
  };

  const removeProject = (id) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        name: name.trim(),
        bio: bio.trim(),
        about: about.trim(),
        currentlyLearning: currentlyLearning.trim(),
        hostel: hostel.trim(),
        roomNo: roomNo.trim(),
        labGroup: labGroup.trim(),
        phone: phone.trim() || null,
        interests,
        skills,
        openTo,
        projects,
        privacySettings,
      };

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      if (onProfileUpdated) {
        onProfileUpdated();
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-container/60 flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
            </div>
            <div>
              <h2 className="font-heading text-headline-sm text-on-surface font-bold">
                Edit Student Profile
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Update your about, projects, learning, and peer privacy controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-surface-container/60 bg-surface-container-low/30 px-6 pt-2 gap-2 overflow-x-auto">
          {[
            { id: 'basic', label: 'Basic & About', icon: 'person' },
            { id: 'learning', label: 'Learning & Skills', icon: 'school' },
            { id: 'projects', label: 'Projects', icon: 'terminal' },
            { id: 'privacy', label: 'Privacy Settings', icon: 'security' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-2.5 px-3 font-heading text-label-md font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-surface-container-lowest rounded-t-lg'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2 text-error">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">error</span>
            <p className="text-body-sm">{errorMsg}</p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          
          {/* TAB 1: BASIC & ABOUT */}
          {activeTab === 'basic' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                    College Roll Number (Verified)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.rollNumber || ''}
                    className="w-full bg-surface-container text-on-surface-variant px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm font-mono cursor-not-allowed opacity-80"
                  />
                </div>
              </div>

              <div>
                <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                  Headline / Quick Bio
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. 2nd Year CSE • Building Nachos OS custom scheduler"
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                  About Me (Detailed)
                </label>
                <textarea
                  rows={4}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Tell classmates about your academic interests, focus areas, and campus life..."
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                    Hostel Name
                  </label>
                  <input
                    type="text"
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    placeholder="Hostel 4 (Kaveri)"
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    placeholder="218"
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                    Lab Slot / Group
                  </label>
                  <input
                    type="text"
                    value={labGroup}
                    onChange={(e) => setLabGroup(e.target.value)}
                    placeholder="CC-03 (Slot B)"
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm uppercase font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                  Contact Phone (Visible only if enabled in Privacy)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LEARNING & SKILLS */}
          {activeTab === 'learning' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-150">
              <div>
                <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                  Currently Learning / Exploring
                </label>
                <input
                  type="text"
                  value={currentlyLearning}
                  onChange={(e) => setCurrentlyLearning(e.target.value)}
                  placeholder="e.g. Nachos OS MLFQ Scheduler, Raft Consensus Algorithm in Go"
                  className="w-full bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                />
                <span className="text-[11px] text-outline mt-1 block">
                  Highlighted with a live status beacon on your profile card.
                </span>
              </div>

              {/* Interests */}
              <div>
                <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                  Academic &amp; Technical Interests
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addInterest();
                      }
                    }}
                    placeholder="Type an interest and press Add..."
                    className="flex-1 bg-surface-container-low text-on-surface px-3 py-1.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={addInterest}
                    className="px-3 py-1.5 bg-primary text-on-primary rounded-xl font-heading text-label-sm font-semibold hover:bg-primary-container transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary-fixed/50 text-on-primary-fixed-variant font-heading text-label-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeInterest(item)}
                        className="hover:text-error text-outline"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                  Technical Stack &amp; Skills
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="e.g. C/C++, Docker, React..."
                    className="flex-1 bg-surface-container-low text-on-surface px-3 py-1.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-3 py-1.5 bg-secondary text-on-secondary rounded-xl font-heading text-label-sm font-semibold hover:bg-secondary-container transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 font-mono text-code-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-error text-outline"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Open To */}
              <div>
                <label className="block font-heading text-label-sm text-on-surface font-semibold mb-1">
                  Open To • Campus Collaboration Tags
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newOpenTo}
                    onChange={(e) => setNewOpenTo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOpenTo();
                      }
                    }}
                    placeholder="e.g. 💻 Nachos OS Lab Viva Prep, ☕ Chai at Prabha Bhawan..."
                    className="flex-1 bg-surface-container-low text-on-surface px-3 py-1.5 rounded-xl border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={addOpenTo}
                    className="px-3 py-1.5 bg-surface-container-high text-on-surface rounded-xl font-heading text-label-sm font-semibold hover:bg-surface-container transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {openTo.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-secondary/10 text-secondary font-heading text-label-sm border border-secondary/20"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeOpenTo(item)}
                        className="hover:text-error text-outline"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-label-lg font-bold text-on-surface">
                    Campus Projects &amp; Mini-Hacks ({projects.length})
                  </h3>
                  <p className="text-body-sm text-on-surface-variant">
                    Showcase lab assignments, hackathon submissions, and campus tools.
                  </p>
                </div>
                {!showAddProject && (
                  <button
                    type="button"
                    onClick={() => setShowAddProject(true)}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-primary text-on-primary font-heading font-semibold text-label-sm hover:bg-primary-container transition-colors shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add Project</span>
                  </button>
                )}
              </div>

              {/* Add Project Sub-Form */}
              {showAddProject && (
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-label-md text-on-surface">New Project</span>
                    <button
                      type="button"
                      onClick={() => setShowAddProject(false)}
                      className="text-outline hover:text-on-surface text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                  <div>
                    <label className="block text-label-sm font-heading font-semibold text-on-surface mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={projectForm.title}
                      onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                      placeholder="e.g. Nachos OS Thread Visualizer"
                      className="w-full bg-surface-container-lowest text-on-surface px-3 py-1.5 rounded-lg border border-outline-variant/30 text-body-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-heading font-semibold text-on-surface mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      placeholder="What does this project do? (e.g. Terminal visualizer mapping context switches for CS204 lab)"
                      className="w-full bg-surface-container-lowest text-on-surface px-3 py-1.5 rounded-lg border border-outline-variant/30 text-body-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-heading font-semibold text-on-surface mb-1">
                      Tech Stack (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={projectForm.techStack}
                      onChange={(e) => setProjectForm({ ...projectForm, techStack: e.target.value })}
                      placeholder="C++, MIPS Assembly, Nachos"
                      className="w-full bg-surface-container-lowest text-on-surface px-3 py-1.5 rounded-lg border border-outline-variant/30 text-body-sm font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-label-sm font-heading font-semibold text-on-surface mb-1">
                        GitHub URL (optional)
                      </label>
                      <input
                        type="url"
                        value={projectForm.githubUrl}
                        onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                        placeholder="https://github.com/..."
                        className="w-full bg-surface-container-lowest text-on-surface px-3 py-1.5 rounded-lg border border-outline-variant/30 text-body-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-label-sm font-heading font-semibold text-on-surface mb-1">
                        Live Demo URL (optional)
                      </label>
                      <input
                        type="url"
                        value={projectForm.liveUrl}
                        onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-surface-container-lowest text-on-surface px-3 py-1.5 rounded-lg border border-outline-variant/30 text-body-sm font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="py-1.5 px-4 bg-primary text-on-primary rounded-xl font-heading text-label-sm font-semibold hover:bg-primary-container"
                    >
                      Save to List
                    </button>
                  </div>
                </div>
              )}

              {/* Projects List */}
              <div className="flex flex-col gap-3">
                {projects.map((proj) => (
                  <div
                    key={proj.id || proj.title}
                    className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-heading font-bold text-label-lg text-on-surface">
                          {proj.title}
                        </h4>
                        {proj.githubUrl && (
                          <a
                            href={sanitizeUrl(proj.githubUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-outline hover:text-primary"
                            title="GitHub Repo"
                          >
                            <span className="material-symbols-outlined text-[16px]">code</span>
                          </a>
                        )}
                      </div>
                      <p className="text-body-sm text-on-surface-variant mb-2">
                        {proj.description}
                      </p>
                      {proj.techStack && (
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(proj.techStack) ? proj.techStack : [proj.techStack]).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-mono bg-surface-container-lowest px-2 py-0.5 rounded text-secondary border border-outline-variant/20"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProject(proj.id)}
                      className="text-outline hover:text-error p-1 transition-colors"
                      title="Remove project"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY SETTINGS */}
          {activeTab === 'privacy' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-150">
              <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 flex items-start gap-2.5 text-secondary">
                <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">verified_user</span>
                <p className="text-body-sm leading-snug">
                  <strong>Campus Privacy Standard:</strong> No popularity ranks, follower counts, or vanity metrics are displayed anywhere on CampusConnect. You control exactly what classmates can see.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* Contact details toggle */}
                <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between">
                  <div className="flex flex-col pr-4">
                    <span className="font-heading font-semibold text-label-md text-on-surface">
                      Show Contact Details (Phone &amp; Direct Email)
                    </span>
                    <span className="text-[12px] text-on-surface-variant">
                      When turned off, contact information is strictly hidden from classmates.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.showContactDetails}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, showContactDetails: e.target.checked })
                    }
                    className="h-5 w-5 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                {/* Room number toggle */}
                <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between">
                  <div className="flex flex-col pr-4">
                    <span className="font-heading font-semibold text-label-md text-on-surface">
                      Show Hostel Room Number
                    </span>
                    <span className="text-[12px] text-on-surface-variant">
                      When off, peers only see your hostel building, and the specific room number is hidden.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.showRoomNumber}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, showRoomNumber: e.target.checked })
                    }
                    className="h-5 w-5 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                {/* Direct Hi toggle */}
                <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between">
                  <div className="flex flex-col pr-4">
                    <span className="font-heading font-semibold text-label-md text-on-surface">
                      Allow Direct 'Say Hi' Icebreaker Notes
                    </span>
                    <span className="text-[12px] text-on-surface-variant">
                      Permits classmates to send contextual notes like 'Chai at Prabha Bhawan?' or 'Nachos OS viva drill'.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.allowDirectHi}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, allowDirectHi: e.target.checked })
                    }
                    className="h-5 w-5 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                {/* Schedule toggle */}
                <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between">
                  <div className="flex flex-col pr-4">
                    <span className="font-heading font-semibold text-label-md text-on-surface">
                      Show Semester Lab Schedule &amp; Slots
                    </span>
                    <span className="text-[12px] text-on-surface-variant">
                      Displays your enrolled courses and CC-3 lab timings for mutual study coordination.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.showSchedule}
                    onChange={(e) =>
                      setPrivacySettings({ ...privacySettings, showSchedule: e.target.checked })
                    }
                    className="h-5 w-5 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="border-t border-surface-container/60 pt-4 flex items-center justify-between mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-outline-variant text-on-surface font-heading font-semibold text-label-md hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading font-semibold text-label-md flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
