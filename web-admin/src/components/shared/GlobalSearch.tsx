import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Search, User, GraduationCap, X } from 'lucide-react';
import { useMembers } from '@/features/members/useMembers';
import { useCoaches } from '@/features/coaches/useCoaches';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch data for search
  const { data: members } = useMembers({ search: query });
  const { data: coaches } = useCoaches();

  // Filter results based on query
  const filteredMembers = members?.filter((m) =>
    m.fullName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3) || [];

  const filteredCoaches = coaches?.filter((c) =>
    c.fullName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3) || [];

  const hasResults = filteredMembers.length > 0 || filteredCoaches.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMemberClick = () => {
    navigate('/members');
    setQuery('');
    setIsOpen(false);
  };

  const handleCoachClick = () => {
    navigate('/coaches');
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search members, coaches..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {hasResults ? (
            <div className="py-2">
              {/* Members Results */}
              {filteredMembers.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Members
                  </div>
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={handleMemberClick}
                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.fullName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {member.groupName} • Age {member.age}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Coaches Results */}
              {filteredCoaches.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Coaches
                  </div>
                  {filteredCoaches.map((coach) => (
                    <button
                      key={coach.id}
                      onClick={handleCoachClick}
                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600/10">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{coach.fullName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {coach.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
