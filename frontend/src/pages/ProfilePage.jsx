import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EditProfileModal from '../components/profile/EditProfileModal';
import SayHiModal from '../components/messages/SayHiModal';
import { sanitizeUrl } from '../utils/sanitizeUrl';

export default function ProfilePage() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { currentUser, refreshUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dual view switcher for profile owner: 'self' or 'peer'
  const [previewAsPeer, setPreviewAsPeer] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Say Hi Modal state for peer interactions
  const [sayHiOpen, setSayHiOpen] = useState(false);
  const [selectedIcebreaker, setSelectedIcebreaker] = useState('Chai at Prabha Bhawan?');
  const [customNote, setCustomNote] = useState('');

  // Post composer state (for owner)
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('academic');
  const [newPostCode, setNewPostCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [posting, setPosting] = useState(false);

  // Group Invite state for peer interaction
  const [groupInviteModalOpen, setGroupInviteModalOpen] = useState(false);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroupToInvite, setSelectedGroupToInvite] = useState('');
  const [sendingGroupInvite, setSendingGroupInvite] = useState(false);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenGroupInvite = async () => {
    try {
      const res = await fetch('/api/groups', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        const groups = data.groups || [];
        setMyGroups(groups);
        if (groups.length > 0) {
          setSelectedGroupToInvite(groups[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not load groups for invite:', e);
    }
    setGroupInviteModalOpen(true);
  };

  const handleSendGroupInvitation = async () => {
    if (!selectedGroupToInvite || sendingGroupInvite) return;
    try {
      setSendingGroupInvite(true);
      const res = await fetch(`/api/groups/${selectedGroupToInvite}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send invitation');
      }
      setGroupInviteModalOpen(false);
      showToast(`Group invitation sent to ${profile.name}!`);
    } catch (err) {
      showToast(err.message || 'Error sending group invitation');
    } finally {
      setSendingGroupInvite(false);
    }
  };

  // Fetch profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const target = identifier || 'me';
      const res = await fetch(`/api/users/${target}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load profile');
      }
      setProfile(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [identifier]);

  // Handle owner toggling a privacy checkbox directly on the profile rail
  const handleTogglePrivacySetting = async (key) => {
    if (!profile?.isOwner) return;

    const currentVal = profile.privacySettings?.[key] ?? false;
    const updatedSettings = {
      ...profile.privacySettings,
      [key]: !currentVal,
    };

    // Optimistic update
    setProfile((prev) => ({
      ...prev,
      privacySettings: updatedSettings,
      ...(key === 'showRoomNumber' ? { roomHidden: !updatedSettings[key] } : {}),
      ...(key === 'showContactDetails' ? { contactHidden: !updatedSettings[key] } : {}),
    }));

    showToast(`Updated privacy: ${key} is now ${!currentVal ? 'enabled' : 'disabled'}`);

    try {
      await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ privacySettings: updatedSettings }),
      });
    } catch (e) {
      console.error('Failed to sync privacy setting:', e);
    }
  };

  // Publish new post to profile
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setPosting(true);
    try {
      const res = await fetch('/api/users/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: newPostContent.trim(),
          codeSnippet: showCodeInput && newPostCode.trim() ? newPostCode.trim() : null,
          category: newPostCategory,
        }),
      });

      const data = await res.json();
      if (res.ok && data.post) {
        setProfile((prev) => ({
          ...prev,
          posts: [data.post, ...(prev.posts || [])],
        }));
        setNewPostContent('');
        setNewPostCode('');
        setShowCodeInput(false);
        showToast('Post published to your profile commons!');
      } else {
        showToast(data.message || 'Failed to publish post');
      }
    } catch (err) {
      showToast('Error publishing post');
    } finally {
      setPosting(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this note from your profile?')) return;
    try {
      const res = await fetch(`/api/users/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          posts: prev.posts.filter((p) => p.id !== postId),
        }));
        showToast('Post deleted successfully.');
      }
    } catch (e) {
      showToast('Failed to delete post.');
    }
  };

  // Initials generator
  const getInitials = (name) => {
    if (!name) return 'CC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-[1360px] mx-auto w-full px-space-md py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary animate-pulse shadow-sm">
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
        </div>
        <p className="font-heading text-label-md text-on-surface-variant font-medium">
          Loading student profile...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto w-full px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto mb-3">
          <span className="material-symbols-outlined text-[28px]">person_off</span>
        </div>
        <h2 className="font-heading text-headline-sm font-bold text-on-surface mb-1">
          Profile Not Found
        </h2>
        <p className="text-body-sm text-on-surface-variant mb-5">
          {error || 'This student profile could not be found in the MNIT CSE directory.'}
        </p>
        <button
          onClick={() => navigate('/discover')}
          className="py-2.5 px-4 rounded-xl bg-primary text-on-primary font-heading font-semibold text-label-md hover:bg-primary-container transition-colors"
        >
          Discover Classmates
        </button>
      </div>
    );
  }

  // Determine effective view mode
  // If owner toggles "previewAsPeer", or if viewing another student, we render peer view
  const isOwner = profile.isOwner;
  const isPeerView = !isOwner || previewAsPeer;

  // Contact details visibility logic:
  // "Contact details must be hidden unless privacy settings allow them."
  const contactVisible = isOwner && !previewAsPeer
    ? true
    : !profile.contactHidden && Boolean(profile.email || profile.phone);

  const roomVisible = isOwner && !previewAsPeer
    ? Boolean(profile.roomNo)
    : !profile.roomHidden && Boolean(profile.roomNo);

  return (
    <div className="max-w-[1360px] mx-auto w-full px-space-md lg:px-space-xl py-space-md animate-in fade-in duration-200">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface px-4 py-2.5 rounded-xl shadow-lg font-heading text-label-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-secondary text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* View-State Switcher Ribbon (Only visible to Profile Owner) */}
      {isOwner && (
        <div className="bg-surface-container-low rounded-2xl p-space-sm mb-space-md border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-space-sm shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">visibility</span>
            <span className="font-heading text-label-md text-on-surface font-semibold">
              Unified Profile View Mode:
            </span>
            <span className="text-body-sm text-on-surface-variant hidden md:inline">
              Toggle to preview how classmates see your profile with your active privacy rules.
            </span>
          </div>

          <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-full border border-outline-variant/30 shadow-xs">
            <button
              onClick={() => {
                setPreviewAsPeer(false);
                showToast('Switched to: My Own View (Management Mode)');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-heading text-label-md transition-all ${
                !previewAsPeer
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>My View (Self)</span>
            </button>

            <button
              onClick={() => {
                setPreviewAsPeer(true);
                showToast('Switched to: Classmate View (Peer Preview)');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-heading text-label-md transition-all ${
                previewAsPeer
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">group</span>
              <span>Classmate (Peer View)</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Master Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 overflow-hidden mb-space-lg">
        {/* Cover Banner */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-primary-fixed/50 via-secondary-fixed/40 to-surface-container-high relative">
          <div className="absolute right-4 bottom-4 px-3 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-[11px] font-heading font-semibold text-primary border border-outline-variant/30 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>MNIT CSE Intranet Verified</span>
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="px-space-md sm:px-space-xl pb-space-lg relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            
            {/* Avatar & Core Info */}
            <div className="flex items-end gap-space-md">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-primary text-on-primary font-heading font-bold text-3xl sm:text-4xl flex items-center justify-center ring-4 ring-surface-container-lowest shadow-md">
                  {getInitials(profile.name)}
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-secondary-container rounded-full ring-2 ring-surface-container-lowest" title="Available for peer collaboration" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-headline-md sm:text-headline-lg font-bold text-on-surface">
                    {profile.name}
                  </h1>
                  <span className="bg-primary-fixed text-on-primary-fixed font-heading text-label-sm px-2.5 py-0.5 rounded-full font-semibold font-mono">
                    {profile.rollNumber}
                  </span>
                </div>
                <p className="font-heading text-label-md text-on-surface-variant mt-0.5">
                  B.Tech CSE • Class of {profile.batchYear || '2027'}
                </p>
                <div className="flex items-center gap-3 text-body-sm text-outline mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">apartment</span>
                    <span>
                      {profile.hostel || 'Hostel 4 (Kaveri)'}
                      {roomVisible ? ` • Room ${profile.roomNo}` : ' • Room Hidden'}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary">terminal</span>
                    <span>Lab Group {profile.labGroup || 'CC-03'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Contextual Action Buttons */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              {!isPeerView ? (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-heading text-label-md font-semibold border border-outline-variant/30 transition-all shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleOpenGroupInvite}
                    className="flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-heading text-label-md font-semibold border border-outline-variant/30 transition-all shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">group_add</span>
                    <span>Invite to Group</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSayHiOpen(true)}
                    className="flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading text-label-md font-semibold transition-all shadow-xs"
                  >
                    <span>Say Hi</span>
                    <span>👋</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main Grid: 2/3 Content Column + 1/3 Sidebar Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        
        {/* Left Column (cols-8) */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          
          {/* Currently Learning Card */}
          {profile.currentlyLearning && (
            <div className="bg-gradient-to-r from-primary-fixed/20 to-surface-container-low rounded-2xl p-space-md border border-primary/20 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">psychology</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading text-label-sm font-bold text-primary uppercase tracking-wider">
                    CURRENTLY LEARNING &amp; EXPLORING
                  </span>
                  <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                </div>
                <p className="font-heading text-label-lg font-semibold text-on-surface">
                  {profile.currentlyLearning}
                </p>
              </div>
            </div>
          )}

          {/* About Narrative */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-xs border border-outline-variant/30">
            <h2 className="font-heading text-headline-sm font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">subject</span>
              About
            </h2>
            <p className="font-sans text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
              {profile.about || profile.bio || 'Student at MNIT Jaipur CSE department. Passionate about computer systems, coding, and peer collaboration.'}
            </p>
          </div>

          {/* Open To Intentions */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-xs border border-outline-variant/30">
            <h2 className="font-heading text-label-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">handshake</span>
              Open To • Campus Collaboration
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.openTo && profile.openTo.length > 0 ? (
                profile.openTo.map((item) => (
                  <span
                    key={item}
                    className="bg-primary-fixed/40 text-on-primary-fixed-variant font-heading text-label-sm px-3 py-1.5 rounded-xl border border-primary/20 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </span>
                ))
              ) : (
                <p className="font-sans text-body-sm text-outline">
                  No collaboration preferences added yet.
                </p>
              )}
            </div>
          </div>

          {/* Campus Projects & Tools */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-xs border border-outline-variant/30">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">terminal</span>
                Campus Projects &amp; Mini-Hacks
              </h2>
              {!isPeerView && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-primary hover:text-primary-container font-heading text-label-sm font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Manage Projects</span>
                </button>
              )}
            </div>

            {profile.projects && profile.projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                {profile.projects.map((proj) => (
                  <div
                    key={proj.id || proj.title}
                    className="bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-heading text-label-lg font-bold text-on-surface">
                          {proj.title}
                        </h3>
                        {proj.githubUrl && (
                          <a
                            href={sanitizeUrl(proj.githubUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-outline hover:text-primary"
                            title="GitHub"
                          >
                            <span className="material-symbols-outlined text-[18px]">code</span>
                          </a>
                        )}
                      </div>
                      <p className="font-sans text-body-sm text-on-surface-variant mb-3 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-surface-container/60 pt-2 flex-wrap gap-2">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(proj.techStack) ? proj.techStack : [proj.techStack]).map((tech) => (
                          <span
                            key={tech}
                            className="text-[10px] font-mono text-secondary bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/20"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      {proj.liveUrl && (
                        <a
                          href={sanitizeUrl(proj.liveUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-heading text-label-sm font-semibold hover:underline"
                        >
                          Live Demo →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50">
                <p className="text-body-sm text-on-surface-variant">
                  No projects listed yet.
                </p>
              </div>
            )}
          </div>

          {/* Technical Stack & Interests */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-xs border border-outline-variant/30">
            <h2 className="font-heading text-headline-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">code_blocks</span>
              Technical Stack &amp; Interests
            </h2>

            <div className="flex flex-col gap-3">
              {/* Skills */}
              <div>
                <span className="text-label-sm font-heading text-outline uppercase tracking-wider block mb-2 font-semibold">
                  Tools &amp; Languages
                </span>
                <div className="flex flex-wrap gap-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <div
                        key={skill}
                        className="bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/20 flex items-center gap-2"
                      >
                        <span className="font-mono text-code-sm text-on-surface font-semibold">{skill}</span>
                      </div>
                    ))
                  ) : (
                    <p className="font-sans text-body-sm text-outline">No tools or skills listed yet.</p>
                  )}
                </div>
              </div>

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="pt-2">
                  <span className="text-label-sm font-heading text-outline uppercase tracking-wider block mb-2 font-semibold">
                    Core Domains
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((int) => (
                      <span
                        key={int}
                        className="bg-surface-container-low px-3 py-1 rounded-xl text-label-sm font-heading text-on-surface-variant border border-outline-variant/20"
                      >
                        {int}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User's Own Posts on Profile */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-xs border border-outline-variant/30">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">forum</span>
                Student Notes &amp; Activity ({profile.posts?.length || 0})
              </h2>
              <span className="text-[11px] text-outline font-heading">
                Quiet commons • No vanity metrics
              </span>
            </div>

            {/* Post Composer (Owner View Only) */}
            {!isPeerView && (
              <form onSubmit={handleCreatePost} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 mb-4 flex flex-col gap-2.5">
                <textarea
                  rows={2}
                  required
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share a Nachos OS viva tip, lab question, or study spot note..."
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline p-2.5 rounded-lg border border-outline-variant/30 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                />

                {showCodeInput && (
                  <textarea
                    rows={4}
                    value={newPostCode}
                    onChange={(e) => setNewPostCode(e.target.value)}
                    placeholder="// Paste relevant code snippet (e.g. semaphore or lock acquisition)..."
                    className="w-full bg-on-surface text-surface p-2.5 rounded-lg font-mono text-code-sm focus:outline-none"
                  />
                )}

                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCodeInput(!showCodeInput)}
                      className={`flex items-center gap-1 text-[12px] font-heading font-semibold px-2 py-1 rounded-lg transition-colors ${
                        showCodeInput ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">code</span>
                      <span>Snippet</span>
                    </button>
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="bg-surface-container text-on-surface-variant text-[12px] font-heading px-2 py-1 rounded-lg border border-outline-variant/20"
                    >
                      <option value="academic">Academic / Viva</option>
                      <option value="nachos-viva">Nachos OS</option>
                      <option value="campus-life">Campus Life</option>
                      <option value="project-collab">Project Collab</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={posting || !newPostContent.trim()}
                    className="py-1.5 px-4 bg-primary text-on-primary font-heading font-semibold text-label-sm rounded-xl hover:bg-primary-container disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {posting ? 'Posting...' : 'Post to Profile'}
                  </button>
                </div>
              </form>
            )}

            {/* Post Items */}
            {profile.posts && profile.posts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {profile.posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-primary bg-primary-fixed/40 px-2 py-0.5 rounded">
                          {post.category || 'General'}
                        </span>
                        <span className="text-[11px] font-heading text-outline">
                          {new Date(post.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {!isPeerView && (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-outline hover:text-error transition-colors p-1"
                          title="Delete post"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>

                    <p className="font-sans text-body-md text-on-surface leading-relaxed">
                      {post.content}
                    </p>

                    {post.codeSnippet && (
                      <div className="rounded-xl overflow-hidden bg-on-surface text-surface mt-1 border border-surface-container">
                        <div className="px-3 py-1 bg-on-surface-variant/30 text-[10px] font-mono text-outline-variant flex items-center justify-between">
                          <span>{post.codeLanguage || 'cpp'}</span>
                          <span className="text-[9px] uppercase tracking-wider">Snippet</span>
                        </div>
                        <pre className="p-3 font-mono text-code-sm overflow-x-auto leading-relaxed text-surface">
                          <code>{post.codeSnippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50">
                <p className="text-body-sm text-on-surface-variant">
                  No notes published yet. Posts shared to the department commons will appear here.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Sidebar Rail (cols-4) */}
        <aside className="lg:col-span-4 flex flex-col gap-space-lg">
          
          {/* Contact Details & Privacy Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/30">
            <h3 className="font-heading text-label-lg font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">contact_mail</span>
              Department Contact
            </h3>

            {contactVisible ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-body-sm text-on-surface">
                  <span className="material-symbols-outlined text-outline text-[18px]">email</span>
                  <span className="font-mono text-body-sm truncate">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2 text-body-sm text-on-surface">
                    <span className="material-symbols-outlined text-outline text-[18px]">phone</span>
                    <span className="font-mono text-body-sm">{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-body-sm text-on-surface">
                  <span className="material-symbols-outlined text-outline text-[18px]">domain</span>
                  <span>MNIT Computer Science &amp; Engineering</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-outline text-[18px] mt-0.5">lock</span>
                <p className="text-body-sm text-on-surface-variant leading-snug">
                  Direct contact details (email &amp; phone) are hidden by student's privacy preferences. Use <strong>"Say Hi 👋"</strong> for peer communication.
                </p>
              </div>
            )}
          </div>

          {/* Current Semester Course Roster */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/30">
            <h3 className="font-heading text-label-lg font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
              Semester 3 Course Roster
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { code: 'CS201', name: 'Data Structures & Algorithms', lab: 'CC-3 Mon 2 PM' },
                { code: 'CS204', name: 'Operating Systems (Nachos)', lab: 'CC-3 Wed 10 AM' },
                { code: 'CS202', name: 'Discrete Mathematics', lab: 'VLTC 302' },
                { code: 'CS203', name: 'Digital Logic & Microprocessors', lab: 'Hardware Lab' },
              ].map((c) => (
                <div key={c.code} className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center justify-between">
                  <div>
                    <span className="font-heading text-label-md font-bold text-on-surface block">
                      {c.code}: {c.name}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-mono">{c.lab}</span>
                  </div>
                  <span className="text-primary material-symbols-outlined text-[18px]">verified</span>
                </div>
              ))}
            </div>
          </div>

          {/* Frequent Study Spots */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/30">
            <h3 className="font-heading text-label-lg font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
              Frequent Study Spots
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Prabha Bhawan 2nd Floor (Quiet Zone)',
                'Central Library Reading Room',
                'Hostel 4 Common Lounge',
                'Computer Center 3',
              ].map((spot) => (
                <span key={spot} className="bg-surface-container text-on-surface-variant font-heading text-label-sm px-2.5 py-1 rounded-lg">
                  {spot}
                </span>
              ))}
            </div>
          </div>

          {/* Intranet Privacy Controls (Interactive for Owner, Informational for Peer) */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-outline-variant/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-label-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">shield</span>
                Intranet Privacy Controls
              </h3>
              {isOwner && (
                <span className="text-[10px] font-mono text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
                  Live Sync
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-heading text-label-md text-on-surface block">
                    Hostel Room Number
                  </span>
                  <span className="text-[11px] text-outline">
                    {profile.privacySettings?.showRoomNumber ? 'Visible to batchmates' : 'Hidden from classmates'}
                  </span>
                </div>
                {isOwner && !previewAsPeer ? (
                  <input
                    type="checkbox"
                    checked={profile.privacySettings?.showRoomNumber ?? true}
                    onChange={() => handleTogglePrivacySetting('showRoomNumber')}
                    className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                ) : (
                  <span className={`text-[12px] font-heading font-semibold ${
                    profile.privacySettings?.showRoomNumber ? 'text-primary' : 'text-outline'
                  }`}>
                    {profile.privacySettings?.showRoomNumber ? 'Visible' : 'Hidden'}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-surface-container/60 pt-2.5">
                <div>
                  <span className="font-heading text-label-md text-on-surface block">
                    Contact Information
                  </span>
                  <span className="text-[11px] text-outline">
                    {profile.privacySettings?.showContactDetails ? 'Email & phone visible' : 'Hidden from classmates'}
                  </span>
                </div>
                {isOwner && !previewAsPeer ? (
                  <input
                    type="checkbox"
                    checked={profile.privacySettings?.showContactDetails ?? false}
                    onChange={() => handleTogglePrivacySetting('showContactDetails')}
                    className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                ) : (
                  <span className={`text-[12px] font-heading font-semibold ${
                    profile.privacySettings?.showContactDetails ? 'text-primary' : 'text-outline'
                  }`}>
                    {profile.privacySettings?.showContactDetails ? 'Visible' : 'Hidden'}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-surface-container/60 pt-2.5">
                <div>
                  <span className="font-heading text-label-md text-on-surface block">
                    Direct 'Say Hi' Notes
                  </span>
                  <span className="text-[11px] text-outline">
                    {profile.privacySettings?.allowDirectHi ?? true ? 'Icebreakers permitted' : 'Restricted'}
                  </span>
                </div>
                {isOwner && !previewAsPeer ? (
                  <input
                    type="checkbox"
                    checked={profile.privacySettings?.allowDirectHi ?? true}
                    onChange={() => handleTogglePrivacySetting('allowDirectHi')}
                    className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                ) : (
                  <span className="text-[12px] font-heading font-semibold text-primary">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>

        </aside>

      </div>

      {/* Edit Profile Modal */}
      {isOwner && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onProfileUpdated={() => {
            fetchProfile();
            refreshUser();
            showToast('Profile and privacy settings saved successfully!');
          }}
        />
      )}

      {/* Say Hi Modal (For Peer View) */}
      <SayHiModal
        peer={profile}
        isOpen={sayHiOpen}
        onClose={() => setSayHiOpen(false)}
        onSuccess={() => showToast(`Sent Say Hi note to ${profile.name}! 👋`)}
      />

      {/* Group Invite Modal (For Peer View) */}
      {groupInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container/60">
              <h3 className="font-heading text-title-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">group_add</span>
                <span>Invite to Group Workspace</span>
              </h3>
              <button
                type="button"
                onClick={() => setGroupInviteModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="font-sans text-body-sm text-on-surface-variant">
              Select a group to send an invitation to <strong>{profile.name}</strong> ({profile.rollNumber}).
            </p>

            {myGroups.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-container-low text-center flex flex-col gap-2">
                <p className="text-body-sm text-outline">You are not a member of any campus groups yet.</p>
                <button
                  type="button"
                  onClick={() => {
                    setGroupInviteModalOpen(false);
                    navigate('/groups');
                  }}
                  className="text-primary hover:underline font-heading font-semibold text-xs"
                >
                  Create a Group First →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-label-sm font-heading font-semibold text-on-surface mb-1">
                    Select Group:
                  </label>
                  <select
                    value={selectedGroupToInvite}
                    onChange={(e) => setSelectedGroupToInvite(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant/30 text-body-sm font-sans focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {myGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.memberCount} members)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 text-[11px] text-outline font-sans">
                  <span>Note: Students must explicitly accept invitations before joining the workspace.</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container/60">
                  <button
                    type="button"
                    onClick={() => setGroupInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-outline hover:text-on-surface font-heading text-label-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendGroupInvitation}
                    disabled={sendingGroupInvite || !selectedGroupToInvite}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary font-heading text-label-sm font-semibold shadow-xs"
                  >
                    {sendingGroupInvite ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
