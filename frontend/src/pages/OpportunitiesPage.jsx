import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import UpdateCard from '../components/opportunities/UpdateCard';
import CreateUpdateModal from '../components/opportunities/CreateUpdateModal';
import SayHiModal from '../components/messages/SayHiModal';

const TABS = [
  { id: 'All', label: 'All Updates', icon: 'dashboard' },
  { id: 'Announcements', label: 'Announcements', icon: 'campaign' },
  { id: 'Academic Updates', label: 'Academic Updates', icon: 'school' },
  { id: 'Events', label: 'Events', icon: 'event' },
  { id: 'Opportunities', label: 'Opportunities', icon: 'work' },
  { id: 'Saved', label: 'Saved Bookmarks', icon: 'bookmark' },
];

const POPULAR_TAGS = [
  'Exams',
  'Nachos',
  'LabViva',
  'Placement',
  'Internship',
  'Hackathon',
  'Research',
  'CP',
  'Codeforces',
];

export default function OpportunitiesPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [officialFilter, setOfficialFilter] = useState('all'); // 'all' | 'official' | 'student'

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sayHiPeer, setSayHiPeer] = useState(null);
  const [isSayHiOpen, setIsSayHiOpen] = useState(false);

  // Sync to calendar feedback
  const [calSynced, setCalSynced] = useState(false);

  // Fetch updates from backend
  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const params = new URLSearchParams();
      if (activeTab !== 'All') {
        params.append('tab', activeTab);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (selectedTag) {
        params.append('tag', selectedTag);
      }
      if (officialFilter === 'official') {
        params.append('isOfficial', 'true');
      } else if (officialFilter === 'student') {
        params.append('isOfficial', 'false');
      }

      const res = await fetch(`/api/updates?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch updates');
      }

      setItems(data.items || []);
    } catch (err) {
      console.error('Error fetching updates:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, selectedTag, officialFilter]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  // Handle Save / Unsave bookmark
  const handleToggleSave = async (itemId, shouldSave) => {
    try {
      const endpoint = `/api/updates/${itemId}/${shouldSave ? 'save' : 'unsave'}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update saved status');
      }

      // If on the 'Saved' tab and unsaving, remove from list
      if (activeTab === 'Saved' && !shouldSave) {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, isSaved: shouldSave } : item
          )
        );
      }
    } catch (err) {
      console.error('Save toggle error:', err);
      throw err;
    }
  };

  // Handle Delete Item
  const handleDeleteItem = async (itemId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/updates/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete update item');
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      alert(`Error deleting item: ${err.message}`);
    }
  };

  // Open Say Hi modal
  const handleOpenSayHi = (peer) => {
    setSayHiPeer(peer);
    setIsSayHiOpen(true);
  };

  // Calendar sync simulation / feedback
  const handleSyncAllCalendar = () => {
    setCalSynced(true);
    setTimeout(() => {
      alert(
        'Calendar feed generated! All official circular deadlines, lab vivas, and exam dates are ready for Google Calendar / Apple Calendar sync.'
      );
      setCalSynced(false);
    }, 800);
  };

  const officialCount = items.filter((i) => i.isOfficial).length;
  const studentCount = items.filter((i) => !i.isOfficial).length;

  return (
    <div className="max-w-[1360px] mx-auto w-full px-space-md lg:px-space-xl py-space-md flex flex-col gap-space-md">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md sm:p-space-lg rounded-3xl border border-outline-variant/30 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-heading text-title-xs uppercase tracking-wider text-primary font-bold">
              Campus Noticeboard &amp; Feed
            </span>
            {isAdmin ? (
              <span className="bg-primary/10 text-primary text-[11px] font-heading font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-primary/20">
                <span className="material-symbols-outlined text-[13px] fill-1">verified</span>
                <span>Administrator Mode</span>
              </span>
            ) : (
              <span className="bg-surface-container text-on-surface-variant text-[11px] font-heading font-medium px-2 py-0.5 rounded-full">
                Student View
              </span>
            )}
          </div>
          <h1 className="font-heading text-headline-lg font-bold text-on-surface">
            Updates &amp; Opportunities
          </h1>
          <p className="font-sans text-body-md text-on-surface-variant max-w-2xl mt-1">
            Department exam circulars, lab viva schedules, internship drives, and peer-organized study hackathons for MNIT Jaipur CSE.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {/* Add / Sync Calendar Button */}
          <button
            onClick={handleSyncAllCalendar}
            className="inline-flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-heading text-label-md px-3.5 py-2.5 rounded-2xl font-semibold border border-outline-variant/30 shadow-2xs transition-all"
            title="Sync all deadlines to Google Calendar"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              calendar_month
            </span>
            <span>{calSynced ? 'Syncing...' : 'Sync Calendar'}</span>
          </button>

          {/* Create Item Button (Admin form or Student submit) */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className={`inline-flex items-center gap-2 font-heading text-label-md font-bold px-4 py-2.5 rounded-2xl shadow-xs transition-all hover:scale-[1.02] flex-1 md:flex-initial justify-center ${
              isAdmin
                ? 'bg-primary text-on-primary hover:bg-primary/90'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isAdmin ? 'add_alert' : 'add_circle'}
            </span>
            <span>{isAdmin ? 'Post Notice (Admin)' : 'Share Student Update'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-surface-container scrollbar-thin">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTag('');
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-heading text-label-md whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-outline-variant/20'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isActive && tab.id === 'Saved' ? 'fill-1' : ''}`}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-2xs flex flex-col gap-3">
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
              placeholder="Search circulars, labs, organizers, venues, or topics..."
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-10 pr-9 py-2 font-sans text-body-md text-on-surface focus:outline-none focus:border-primary"
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

          {/* Official vs Student Filter */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
            <button
              onClick={() => setOfficialFilter('all')}
              className={`px-3 py-1 rounded-lg text-[12px] font-heading font-semibold transition-all ${
                officialFilter === 'all'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setOfficialFilter('official')}
              className={`px-3 py-1 rounded-lg text-[12px] font-heading font-semibold transition-all flex items-center gap-1 ${
                officialFilter === 'official'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span>🏛️ Official</span>
            </button>
            <button
              onClick={() => setOfficialFilter('student')}
              className={`px-3 py-1 rounded-lg text-[12px] font-heading font-semibold transition-all flex items-center gap-1 ${
                officialFilter === 'student'
                  ? 'bg-surface text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span>🌱 Peer</span>
            </button>
          </div>
        </div>

        {/* Popular Tag Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 scrollbar-none text-[12px]">
          <span className="font-heading text-outline font-semibold whitespace-nowrap">
            Filter by tag:
          </span>
          {POPULAR_TAGS.map((tag) => {
            const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? '' : tag)}
                className={`px-2.5 py-1 rounded-full font-heading font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-primary text-on-primary font-bold shadow-2xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/20'
                }`}
              >
                #{tag}
              </button>
            );
          })}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag('')}
              className="text-error hover:underline text-[11px] font-heading font-bold whitespace-nowrap"
            >
              Clear tag
            </button>
          )}
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-[12px] text-outline pt-2 border-t border-surface-container/60">
          <span>
            Showing <strong>{items.length}</strong> {activeTab === 'Saved' ? 'saved items' : 'updates'}
            {items.length > 0 && (
              <>
                {' '}• <strong>{officialCount}</strong> official circulars •{' '}
                <strong>{studentCount}</strong> student initiatives
              </>
            )}
          </span>
          {(searchQuery || selectedTag || officialFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('');
                setOfficialFilter('all');
              }}
              className="text-primary hover:underline font-heading font-semibold"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {errorMsg ? (
        <div className="bg-error-container/30 border border-error/30 rounded-2xl p-6 text-center text-error flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[32px]">error</span>
          <p className="font-sans text-body-md">{errorMsg}</p>
          <button
            onClick={fetchUpdates}
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
          <span className="font-heading text-label-md">Loading campus updates...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/30 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-[32px]">
              {activeTab === 'Saved' ? 'bookmark_border' : 'inbox'}
            </span>
          </div>
          <h3 className="font-heading text-headline-sm font-bold text-on-surface">
            {activeTab === 'Saved'
              ? 'No saved bookmarks yet'
              : 'No updates found matching your filters'}
          </h3>
          <p className="font-sans text-body-md text-on-surface-variant max-w-md">
            {activeTab === 'Saved'
              ? 'Bookmark important deadlines, exam circulars, and hackathons by clicking the save icon on any notice.'
              : 'Try adjusting your search terms, changing the category tab, or clearing tag filters.'}
          </p>
          {(searchQuery || selectedTag || officialFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('');
                setOfficialFilter('all');
              }}
              className="px-4 py-2 bg-primary text-on-primary font-heading text-label-md font-bold rounded-xl mt-2"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-space-md">
          {items.map((item) => (
            <UpdateCard
              key={item.id}
              item={item}
              currentUser={currentUser}
              onToggleSave={handleToggleSave}
              onDelete={handleDeleteItem}
              onTagClick={(tag) => setSelectedTag(tag)}
              onSayHi={handleOpenSayHi}
            />
          ))}
        </div>
      )}

      {/* Admin / Student Post Modal */}
      <CreateUpdateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        onCreated={(newItem) => {
          setItems((prev) => [newItem, ...prev]);
        }}
      />

      {/* Say Hi Modal for Student Submissions */}
      <SayHiModal
        peer={sayHiPeer}
        isOpen={isSayHiOpen}
        onClose={() => {
          setIsSayHiOpen(false);
          setSayHiPeer(null);
        }}
        onSuccess={() => {
          setIsSayHiOpen(false);
          setSayHiPeer(null);
        }}
      />
    </div>
  );
}
