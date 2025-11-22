import React, { useState, useEffect } from 'react';
import { getFriendFeed, searchUsers, getFriendsByIds } from '../services/friendsService';
import { FriendLog, User, FriendProfile } from '../types';
import { BRISTOL_SCALE_DATA } from '../constants';
import { Users, Search, UserPlus, UserMinus, MessageCircle, Loader2 } from 'lucide-react';

interface FriendFeedProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
}

const REACTION_OPTIONS = ['💩', '🎉', '😨', '❤️', '👍'];

export const FriendFeed: React.FC<FriendFeedProps> = ({ currentUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'MANAGE'>('FEED');
  
  // Feed State
  const [feed, setFeed] = useState<FriendLog[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Manage State
  const [myFriends, setMyFriends] = useState<FriendProfile[]>([]);
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Initial Load
  useEffect(() => {
    if (activeTab === 'FEED') {
        loadFeed();
    } else {
        loadFriendsList();
    }
  }, [activeTab, currentUser.friends]);

  const loadFeed = async () => {
    setLoadingFeed(true);
    const data = await getFriendFeed(currentUser);
    setFeed(data);
    setLoadingFeed(false);
  };

  const loadFriendsList = async () => {
    if (currentUser.friends && currentUser.friends.length > 0) {
        const profiles = await getFriendsByIds(currentUser.friends);
        setMyFriends(profiles);
    } else {
        setMyFriends([]);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      
      setIsSearching(true);
      const results = await searchUsers(searchQuery);
      // Filter out self and existing friends
      const filtered = results.filter(r => 
        r.id !== currentUser.id && 
        !currentUser.friends?.includes(r.id)
      );
      setSearchResults(filtered);
      setIsSearching(false);
  };

  const handleAddFriend = (friendId: string) => {
      const currentFriends = currentUser.friends || [];
      if (currentFriends.includes(friendId)) return;

      const updatedUser = {
          ...currentUser,
          friends: [...currentFriends, friendId]
      };
      onUpdateUser(updatedUser);
      
      // Remove from search results immediately
      setSearchResults(prev => prev.filter(p => p.id !== friendId));
      alert("Friend added!");
  };

  const handleRemoveFriend = (friendId: string) => {
      const updatedUser = {
          ...currentUser,
          friends: (currentUser.friends || []).filter(id => id !== friendId)
      };
      onUpdateUser(updatedUser);
      setMyFriends(prev => prev.filter(f => f.id !== friendId));
  };

  const handleReaction = (logId: string, emoji: string) => {
    setFeed(currentFeed => 
      currentFeed.map(log => {
        if (log.id !== logId) return log;

        const existingReactionIndex = log.reactions.findIndex(r => r.emoji === emoji);
        let newReactions = [...log.reactions];

        if (existingReactionIndex >= 0) {
          // Toggle existing
          const reaction = newReactions[existingReactionIndex];
          if (reaction.userReacted) {
            reaction.count--;
            reaction.userReacted = false;
            if (reaction.count === 0) {
                newReactions.splice(existingReactionIndex, 1);
            }
          } else {
            reaction.count++;
            reaction.userReacted = true;
          }
        } else {
          // Add new
          newReactions.push({ emoji, count: 1, userReacted: true });
        }

        return { ...log, reactions: newReactions };
      })
    );
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in">
      {/* Tab Switcher */}
      <div className="flex bg-white dark:bg-stone-900 p-1 rounded-xl border border-brown-100 dark:border-stone-800 mb-4">
          <button 
            onClick={() => setActiveTab('FEED')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'FEED' ? 'bg-brown-100 text-brown-800 dark:bg-stone-800 dark:text-stone-200 shadow-sm' : 'text-brown-400 dark:text-stone-500 hover:bg-brown-50 dark:hover:bg-stone-800'}`}
          >
              Activity Feed
          </button>
          <button 
            onClick={() => setActiveTab('MANAGE')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'MANAGE' ? 'bg-brown-100 text-brown-800 dark:bg-stone-800 dark:text-stone-200 shadow-sm' : 'text-brown-400 dark:text-stone-500 hover:bg-brown-50 dark:hover:bg-stone-800'}`}
          >
              My Friends
          </button>
      </div>

      {/* === FEED TAB === */}
      {activeTab === 'FEED' && (
          <div className="space-y-4">
              {loadingFeed ? (
                  <div className="text-center py-10 text-brown-400 dark:text-stone-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Loading logs...</p>
                  </div>
              ) : feed.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-brown-100 dark:border-stone-800">
                      <Users className="w-12 h-12 text-brown-300 dark:text-stone-600 mx-auto mb-2" />
                      <h3 className="text-lg font-bold text-brown-800 dark:text-stone-200">It's quiet in here...</h3>
                      <p className="text-brown-500 dark:text-stone-500 text-sm px-6 mb-4">
                          {(currentUser.friends?.length || 0) === 0 
                            ? "You haven't added any friends yet. Go to 'My Friends' to find people!" 
                            : "Your friends haven't logged anything recently."}
                      </p>
                      {(currentUser.friends?.length || 0) === 0 && (
                         <button onClick={() => setActiveTab('MANAGE')} className="px-4 py-2 bg-brown-600 text-white rounded-lg text-sm font-bold hover:bg-brown-700">
                             Find Friends
                         </button>
                      )}
                  </div>
              ) : (
                feed.map((log) => {
                    const typeInfo = BRISTOL_SCALE_DATA.find((d) => d.type === log.type);
                    const date = new Date(log.timestamp);
                    
                    return (
                        <div key={log.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-brown-100 dark:border-stone-800 flex flex-col gap-3">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                {log.userAvatar ? (
                                    <img src={log.userAvatar} alt="av" className="w-10 h-10 rounded-full bg-brown-100 dark:bg-stone-800" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-brown-100 dark:bg-stone-800 flex items-center justify-center font-bold text-brown-700 dark:text-stone-300">
                                        {log.username.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-brown-900 dark:text-stone-200">
                                    {log.username} <span className="font-normal text-brown-500 dark:text-stone-500">logged</span>
                                </p>
                                <span className="text-xs text-brown-400 dark:text-stone-600">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            
                            <div className="mt-2 flex items-center gap-2 bg-brown-50 dark:bg-stone-800/50 p-2 rounded-lg border border-transparent dark:border-stone-800">
                                <span className="text-xl">{typeInfo?.icon}</span>
                                <div>
                                    <div className="text-sm font-semibold text-brown-800 dark:text-stone-300">Type {log.type}</div>
                                    <div className="text-xs text-brown-600 dark:text-stone-500">{typeInfo?.health}</div>
                                </div>
                            </div>
                            
                            {log.notes && (
                                <div className="mt-2 flex gap-2">
                                    <MessageCircle className="w-4 h-4 text-brown-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-brown-600 dark:text-stone-400 italic">"{log.notes}"</p>
                                </div>
                            )}
                            </div>
                        </div>

                        {/* Reaction Bar */}
                        <div className="flex flex-wrap items-center gap-2 ml-14 pt-1 border-t border-brown-50 dark:border-stone-800">
                            {REACTION_OPTIONS.map(emoji => {
                                const reaction = log.reactions.find(r => r.emoji === emoji);
                                const isActive = reaction?.userReacted;
                                const count = reaction?.count || 0;

                                return (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(log.id, emoji)}
                                        className={`
                                            flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all
                                            ${isActive 
                                                ? 'bg-brown-200 text-brown-800 dark:bg-brown-900 dark:text-brown-200 ring-1 ring-brown-300 dark:ring-brown-700' 
                                                : 'bg-transparent hover:bg-brown-50 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-500'
                                            }
                                            ${count > 0 ? 'opacity-100' : 'opacity-50 hover:opacity-100'}
                                        `}
                                    >
                                        <span>{emoji}</span>
                                        {count > 0 && <span className="font-semibold">{count}</span>}
                                    </button>
                                );
                            })}
                        </div>
                        </div>
                    );
                })
              )}
          </div>
      )}

      {/* === MANAGE FRIENDS TAB === */}
      {activeTab === 'MANAGE' && (
          <div className="space-y-6">
              {/* Search Box */}
              <div className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-brown-100 dark:border-stone-800">
                  <h3 className="text-sm font-bold text-brown-800 dark:text-stone-200 mb-3 flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Find Friends
                  </h3>
                  <form onSubmit={handleSearch} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search usernames (e.g., Gary)" 
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 border-none text-sm focus:ring-2 focus:ring-brown-500 outline-none text-stone-900 dark:text-stone-100"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isSearching}
                        className="bg-brown-600 hover:bg-brown-700 text-white px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                          {isSearching ? '...' : 'Search'}
                      </button>
                  </form>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-stone-100 dark:border-stone-800 pt-4">
                          <p className="text-xs text-stone-500 font-semibold mb-2">Results</p>
                          {searchResults.map(user => (
                              <div key={user.id} className="flex items-center justify-between p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                                  <div className="flex items-center gap-3">
                                      <img src={user.avatar} alt="av" className="w-8 h-8 rounded-full bg-stone-200" />
                                      <div>
                                          <div className="text-sm font-bold text-brown-900 dark:text-stone-200">{user.username}</div>
                                          <div className="text-xs text-stone-500">Lvl {user.level}</div>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={() => handleAddFriend(user.id)}
                                    className="text-xs bg-brown-600 text-white px-3 py-1.5 rounded-full hover:bg-brown-700 transition-colors font-medium"
                                  >
                                      Add
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
                  {searchResults.length === 0 && searchQuery && !isSearching && (
                      <div className="mt-3 text-xs text-stone-500 italic">No users found. Try 'Gary', 'Lisa', or 'Bob'.</div>
                  )}
              </div>

              {/* Current Friend List */}
              <div>
                <h3 className="text-sm font-bold text-brown-800 dark:text-stone-200 mb-3 px-1">
                    Your Friends ({myFriends.length})
                </h3>
                {myFriends.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-stone-400">
                        No friends added yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {myFriends.map(friend => (
                            <div key={friend.id} className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 border border-brown-100 dark:border-stone-800 rounded-xl">
                                 <div className="flex items-center gap-3">
                                      <img src={friend.avatar} alt="av" className="w-10 h-10 rounded-full bg-stone-200" />
                                      <div>
                                          <div className="text-sm font-bold text-brown-900 dark:text-stone-200">{friend.username}</div>
                                          <div className="text-xs text-amber-600 dark:text-amber-500 font-medium">Level {friend.level}</div>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={() => handleRemoveFriend(friend.id)}
                                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                    title="Remove Friend"
                                  >
                                      <UserMinus className="w-4 h-4" />
                                  </button>
                            </div>
                        ))}
                    </div>
                )}
              </div>
          </div>
      )}
    </div>
  );
};