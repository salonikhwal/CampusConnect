import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

const routeTitles = {
  '/': 'Home Feed',
  '/community': 'Community Discussions',
  '/discover': 'Discover People',
  '/groups': 'Groups & Projects',
  '/seniors': 'Seniors & Guidance',
  '/opportunities': 'Updates & Opportunities',
  '/messages': 'Messages',
  '/profile': 'My Profile',
};

export default function Header({ onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Omni-search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const currentTitle = routeTitles[location.pathname] || 'CampusConnect';

  const getInitials = (name) => {
    if (!name) return 'CC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Close search dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok) {
          setSearchResults(data.results || { people: [], posts: [], groups: [] });
          setIsDropdownOpen(true);
        }
      } catch (err) {
        console.warn('Omni-search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (path) => {
    setIsDropdownOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const hasAnyResults =
    searchResults &&
    (searchResults.people?.length > 0 ||
      searchResults.posts?.length > 0 ||
      searchResults.groups?.length > 0);

  return (
    <>
      <header className="fixed top-0 left-0 md:left-64 right-0 z-30 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/20 transition-all duration-300">
        <div className="h-16 w-full px-space-md lg:px-space-lg flex items-center justify-between gap-space-md">
          
          {/* Left Side: Mobile Menu Button + Breadcrumbs */}
          <div className="flex items-center gap-space-md flex-1 max-w-2xl min-w-0">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container md:hidden flex-shrink-0"
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-1.5 text-on-surface-variant font-heading text-label-md truncate">
              <span 
                onClick={() => navigate('/')} 
                className="hover:text-primary transition-colors cursor-pointer"
              >
                MNIT Jaipur
              </span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span 
                onClick={() => navigate('/')} 
                className="hover:text-primary transition-colors cursor-pointer hidden lg:inline"
              >
                Computer Science &amp; Eng.
              </span>
              <span className="material-symbols-outlined text-[14px] hidden lg:inline">chevron_right</span>
              <span className="text-primary font-semibold truncate">{currentTitle}</span>
            </div>

            {/* Live Campus Notice Pill */}
            <div className="hidden xl:flex items-center gap-space-xs bg-surface-container px-space-sm py-1 rounded-full text-on-surface-variant font-heading text-label-sm border border-outline-variant/30 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
              <span>Campus Digital Commons</span>
            </div>
          </div>

          {/* Right Side: Omni-Search + Notifications + Profile */}
          <div className="flex items-center gap-space-sm sm:gap-space-md flex-shrink-0">
            
            {/* Desktop Omni-search Bar */}
            <div ref={searchContainerRef} className="relative hidden md:block w-72 lg:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setIsDropdownOpen(true);
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people, posts, groups..."
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm pl-9 pr-8 py-1.5 rounded-xl border border-outline-variant/25 focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-2xs"
              />
              {isSearching ? (
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-primary text-[16px] animate-spin">
                  progress_activity
                </span>
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              ) : null}

              {/* Omni-search Dropdown Results */}
              {isDropdownOpen && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden z-50 max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  {!hasAnyResults ? (
                    <div className="p-6 text-center text-outline font-sans text-body-sm">
                      <span className="material-symbols-outlined text-[28px] text-outline block mb-1">
                        search_off
                      </span>
                      <span>No people, posts, or groups matching "{searchQuery}"</span>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-surface-container">
                      {/* 1. People Section */}
                      {searchResults.people?.length > 0 && (
                        <div className="p-2.5">
                          <span className="px-2.5 py-1 text-[11px] font-heading font-bold text-outline uppercase tracking-wider block">
                            People ({searchResults.people.length})
                          </span>
                          <div className="flex flex-col gap-0.5 mt-1">
                            {searchResults.people.map((person) => (
                              <button
                                key={person.id}
                                onClick={() => handleSelectResult(`/profile/${person.id}`)}
                                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-container text-left transition-colors"
                              >
                                <img
                                  src={
                                    person.avatarUrl ||
                                    `https://api.dicebear.com/7.x/initials/svg?seed=${person.name}`
                                  }
                                  alt={person.name}
                                  className="w-8 h-8 rounded-full object-cover border border-outline-variant/30 flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-heading text-label-md font-bold text-on-surface truncate">
                                      {person.name}
                                    </span>
                                    <span className="text-[11px] font-heading text-outline">
                                      {person.yearLabel}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-sans text-on-surface-variant truncate">
                                    {person.rollNumber} {person.hostel ? `• ${person.hostel}` : ''}
                                  </p>
                                </div>
                                <span className="material-symbols-outlined text-[16px] text-outline">
                                  chevron_right
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Posts Section */}
                      {searchResults.posts?.length > 0 && (
                        <div className="p-2.5">
                          <span className="px-2.5 py-1 text-[11px] font-heading font-bold text-outline uppercase tracking-wider block">
                            Community Posts ({searchResults.posts.length})
                          </span>
                          <div className="flex flex-col gap-0.5 mt-1">
                            {searchResults.posts.map((post) => (
                              <button
                                key={post.id}
                                onClick={() => handleSelectResult('/community')}
                                className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-container text-left transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="material-symbols-outlined text-[16px]">
                                    forum
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="font-heading text-label-md font-bold text-on-surface block truncate">
                                    {post.title}
                                  </span>
                                  <p className="text-[11px] font-sans text-on-surface-variant truncate">
                                    {post.snippet}
                                  </p>
                                </div>
                                <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded font-heading font-semibold text-on-surface-variant flex-shrink-0">
                                  {post.category}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Groups Section */}
                      {searchResults.groups?.length > 0 && (
                        <div className="p-2.5">
                          <span className="px-2.5 py-1 text-[11px] font-heading font-bold text-outline uppercase tracking-wider block">
                            Campus Groups ({searchResults.groups.length})
                          </span>
                          <div className="flex flex-col gap-0.5 mt-1">
                            {searchResults.groups.map((group) => (
                              <button
                                key={group.id}
                                onClick={() => handleSelectResult(`/groups/${group.id}`)}
                                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-container text-left transition-colors"
                              >
                                <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 font-bold text-xs font-heading">
                                  <span className="material-symbols-outlined text-[18px]">groups</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="font-heading text-label-md font-bold text-on-surface block truncate">
                                    {group.name}
                                  </span>
                                  <p className="text-[11px] font-sans text-on-surface-variant truncate">
                                    {group.description}
                                  </p>
                                </div>
                                <span className="text-[11px] font-sans text-outline flex-shrink-0">
                                  {group.memberCount} members
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden w-9 h-9 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
              title="Search"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>

            {/* Notifications Button */}
            <button 
              type="button"
              onClick={() => navigate('/opportunities')}
              className="relative w-9 h-9 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
              title="Official Notices & Circulars"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
            </button>

            {/* Avatar / Sign In */}
            {currentUser ? (
              <div 
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading font-bold text-xs flex items-center justify-center cursor-pointer transition-colors shadow-2xs border border-primary/20"
                title={`${currentUser.name} (${currentUser.rollNumber})`}
              >
                {getInitials(currentUser.name)}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading font-medium text-xs transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="md:hidden p-3 border-t border-surface-container bg-surface-container-lowest animate-in fade-in duration-150">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people, posts, groups..."
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm pl-9 pr-8 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Mobile Dropdown Results */}
            {searchResults && hasAnyResults && (
              <div className="mt-2 bg-surface-container-low rounded-xl p-2 max-h-64 overflow-y-auto flex flex-col gap-2">
                {searchResults.people?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-heading font-bold text-outline uppercase px-1">People</span>
                    {searchResults.people.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectResult(`/profile/${p.id}`)}
                        className="p-1.5 text-[12px] font-heading font-semibold text-on-surface cursor-pointer hover:bg-surface-container rounded"
                      >
                        {p.name} ({p.rollNumber})
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.posts?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-heading font-bold text-outline uppercase px-1">Posts</span>
                    {searchResults.posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handleSelectResult('/community')}
                        className="p-1.5 text-[12px] font-heading font-semibold text-on-surface cursor-pointer hover:bg-surface-container rounded truncate"
                      >
                        {post.title}
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.groups?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-heading font-bold text-outline uppercase px-1">Groups</span>
                    {searchResults.groups.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => handleSelectResult(`/groups/${g.id}`)}
                        className="p-1.5 text-[12px] font-heading font-semibold text-on-surface cursor-pointer hover:bg-surface-container rounded"
                      >
                        {g.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
