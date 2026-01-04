
import React, { useState, useEffect } from 'react';
import { getFriendFeed, searchUsers, getFriendsByIds, getFriendRequests, sendFriendRequest, acceptFriendRequest, denyFriendRequest, cancelFriendRequest } from '../services/friendsService';
import { FriendLog, User, FriendProfile } from '../types';
import { BRISTOL_SCALE_DATA } from '../constants';
import { Users, Search, UserPlus, UserMinus, MessageCircle, Loader2, UserCheck, Clock, Check, X, RefreshCw } from 'lucide-react';

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
  const [incomingRequests, setIncomingRequests] = useState<FriendProfile[]>([]);
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'FEED') {
        loadFeed();
    } else {
        loadFriendsData();
    }
  }, [activeTab, currentUser.friends, currentUser.friendRequests, currentUser.outgoingRequests]);

  const loadFeed = async () => {
    setLoadingFeed(true);
    const data = await getFriendFeed(currentUser);
    setFeed(data);
    setLoadingFeed(false);
  };

  const loadFriendsData = async () => {
    if (currentUser.friends && currentUser.friends.length > 0) {
        const profiles = await getFriendsByIds(currentUser.friends);
        setMyFriends(profiles);
    } else {
        setMyFriends([]);
    }

    if (currentUser.friendRequests && currentUser.friendRequests.length > 0) {
        const requests = await getFriendRequests(currentUser.friendRequests);
        setIncomingRequests(requests);
    } else {
        setIncomingRequests([]);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      
      setIsSearching(true);
      const results = await searchUsers(searchQuery, currentUser.id);
      setSearchResults(results);
      setIsSearching(false);
  };

  const handleSendRequest = async (targetId: string) => {
      setPendingActionId(targetId);
      try {
        const updatedUser = await sendFriendRequest(currentUser, targetId);
        onUpdateUser(updatedUser);
      } catch (e) {
          console.error(e);
      } finally {
        setPendingActionId(null);
      }
  };

  const handleCancelRequest = async (targetId: string) => {
    setPendingActionId(targetId);
    try {
      const updatedUser = await cancelFriendRequest(currentUser, targetId);
      onUpdateUser(updatedUser);
    } catch (e) {
        console.error(e);
    } finally {
      setPendingActionId(null);
    }
  };

  const handleAcceptRequest = async (requesterId: string) => {
    setPendingActionId(requesterId);
    try {
        const updatedUser = await acceptFriendRequest(currentUser, requesterId);
        onUpdateUser(updatedUser);
    } catch (e) {
        console.error(e);
    } finally {
        setPendingActionId(null);
    }
  };

  const handleDenyRequest = async (requesterId: string) => {
    setPendingActionId(requesterId);
    try {
        const updatedUser = await denyFriendRequest(currentUser, requesterId);
        onUpdateUser(updatedUser);
    } catch (e) {
        console.error(e);
    } finally {
        setPendingActionId(null);
    }
  };

  const handleRemoveFriend = (friendId: string) => {
      if(!confirm("Are you sure you want to remove this friend?")) return;
      const updatedUser = {
          ...currentUser,
          friends: (currentUser.friends || []).filter(id => id !== friendId)
      };
      onUpdateUser(updatedUser);
  };

  const handleReaction = (logId: string, emoji: string) => {
    setFeed(currentFeed => 
      currentFeed.map(log => {
        if (log.id !== logId) return log;
        const existingReactionIndex = log.reactions.findIndex(r => r.emoji === emoji);
        let newReactions = [...log.reactions];
        if (existingReactionIndex >= 0) {
          const reaction = newReactions[existingReactionIndex];
          if (reaction.userReacted) {
            reaction.count--;
            reaction.userReacted = false;
            if (reaction.count === 0) newReactions.splice(existingReactionIndex, 1);
          } else {
            reaction.count++;
            reaction.userReacted = true;
          }
        } else {
          newReactions.push({ emoji, count: 1, userReacted: true });
        }
        return { ...log, reactions: newReactions };
      })
    );
  };

  const getRelationshipStatus = (profileId: string) => {
      if (currentUser.friends?.includes(profileId)) return 'FRIEND';
      if (currentUser.friendRequests?.includes(profileId)) return 'INCOMING';
      if (currentUser.outgoingRequests?.includes(profileId)) return 'OUTGOING';
      return 'NONE';
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
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all relative ${activeTab === 'MANAGE' ? 'bg-brown-100 text-brown-800 dark:bg-stone-800 dark:text-stone-200 shadow-sm' : 'text-brown-400 dark:text-stone-500 hover:bg-brown-50 dark:hover:bg-stone-800'}`}
          >
              My Friends
              {incomingRequests.length > 0 && (
                  <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
          </button>
      </div>

      {activeTab === 'FEED' && (
          <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-brown-400 uppercase tracking-widest">Recent Activity</h3>
                  <button onClick={loadFeed} className="text-brown-600 dark:text-brown-400 hover:rotate-180 transition-transform duration-500 p-1">
                      <RefreshCw className={`w-4 h-4 ${loadingFeed ? 'animate-spin' : ''}`} />
                  </button>
              </div>
              
              {loadingFeed ? (
                  <div className="text-center py-10 text-brown-400 dark:text-stone-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Sniffing out logs...</p>
                  </div>
              ) : feed.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-brown-100 dark:border-stone-800">
                      <Users className="w-12 h-12 text-brown-300 dark:text-stone-600 mx-auto mb-2" />
                      <h3 className="text-lg font-bold text-brown-800 dark:text-stone-200">The feed is empty</h3>
                      <p className="text-brown-500 dark:text-stone-500 text-sm px-6 mb-4">
                          {(currentUser.friends?.length || 0) === 0 
                            ? "Friends make logging fun! Add some people to see their bowel movements here." 
                            : "Your friends are keeping things private today."}
                      </p>
                      {(currentUser.friends?.length || 0) === 0 && (
                         <button onClick={() => setActiveTab('MANAGE')} className="px-6 py-2 bg-brown-600 text-white rounded-xl text-sm font-bold hover:bg-brown-700 shadow-lg shadow-brown-100 dark:shadow-none">
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
                                        <span className="text-xs text-brown-400 dark:text-stone-600">
                                            {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
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
                                                ${count > 0 ? 'opacity-100' : 'opacity-40 hover:opacity-100'}
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

      {activeTab === 'MANAGE' && (
          <div className="space-y-6">
              {incomingRequests.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                          <UserPlus className="w-4 h-4" /> Incoming Requests
                      </h3>
                      <div className="space-y-2">
                          {incomingRequests.map(req => (
                               <div key={req.id} className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 rounded-xl shadow-sm">
                                   <div className="flex items-center gap-3">
                                      <img src={req.avatar} alt="av" className="w-10 h-10 rounded-full bg-stone-200" />
                                      <div>
                                          <div className="text-sm font-bold text-brown-900 dark:text-stone-200">{req.username}</div>
                                          <div className="text-xs text-stone-500">Lvl {req.level}</div>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleAcceptRequest(req.id)}
                                        disabled={pendingActionId === req.id}
                                        className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-full transition-colors"
                                      >
                                          {pendingActionId === req.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />}
                                      </button>
                                      <button 
                                        onClick={() => handleDenyRequest(req.id)}
                                        disabled={pendingActionId === req.id}
                                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full transition-colors"
                                      >
                                           <X className="w-4 h-4" />
                                      </button>
                                  </div>
                               </div>
                          ))}
                      </div>
                  </div>
              )}

              <div className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-brown-100 dark:border-stone-800">
                  <h3 className="text-sm font-bold text-brown-800 dark:text-stone-200 mb-3 flex items-center gap-2">
                      <Search className="w-4 h-4" /> Find New Friends
                  </h3>
                  <form onSubmit={handleSearch} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Username or ID" 
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 border-none text-sm focus:ring-2 focus:ring-brown-500 outline-none text-stone-900 dark:text-stone-100"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isSearching}
                        className="bg-brown-600 hover:bg-brown-700 text-white px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                      </button>
                  </form>

                  {searchResults.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-stone-100 dark:border-stone-800 pt-4 animate-in slide-in-from-top-2">
                          <p className="text-xs text-stone-500 font-semibold mb-2">Results</p>
                          {searchResults.map(user => {
                              const status = getRelationshipStatus(user.id);
                              return (
                                <div key={user.id} className="flex items-center justify-between p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatar} alt="av" className="w-8 h-8 rounded-full bg-stone-200" />
                                        <div>
                                            <div className="text-sm font-bold text-brown-900 dark:text-stone-200">{user.username}</div>
                                            <div className="text-xs text-stone-500">Lvl {user.level}</div>
                                        </div>
                                    </div>
                                    {status === 'FRIEND' && (
                                        <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                            <UserCheck className="w-3 h-3" /> Friends
                                        </span>
                                    )}
                                    {status === 'OUTGOING' && (
                                        <button 
                                            onClick={() => handleCancelRequest(user.id)}
                                            disabled={pendingActionId === user.id}
                                            className="text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 px-3 py-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors font-medium flex items-center gap-1 group"
                                        >
                                            {pendingActionId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3 group-hover:hidden" />}
                                            {pendingActionId !== user.id && <X className="w-3 h-3 hidden group-hover:block" />}
                                            <span className="group-hover:hidden">Pending</span>
                                            <span className="hidden group-hover:inline">Cancel</span>
                                        </button>
                                    )}
                                    {status === 'INCOMING' && (
                                         <button 
                                            onClick={() => handleAcceptRequest(user.id)}
                                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors font-medium"
                                         >
                                            Accept
                                         </button>
                                    )}
                                    {status === 'NONE' && (
                                        <button 
                                            onClick={() => handleSendRequest(user.id)}
                                            disabled={pendingActionId === user.id}
                                            className="text-xs bg-brown-600 text-white px-3 py-1.5 rounded-full hover:bg-brown-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {pendingActionId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                                            Request
                                        </button>
                                    )}
                                </div>
                              );
                          })}
                      </div>
                  )}
                  {searchQuery && !isSearching && searchResults.length === 0 && (
                      <p className="mt-4 text-center text-xs text-stone-400 italic">No users found with that name.</p>
                  )}
              </div>

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
