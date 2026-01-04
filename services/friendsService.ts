
import { FriendLog, BristolType, FriendProfile, User } from '../types';
import { getAllUsers, getUserById, updateOtherUser, updateUserProfile } from './authService';

// --- SIMULATED DATABASE ---
const MOCK_DATABASE_USERS: FriendProfile[] = [
  { id: 'u_gary', username: 'Gary_The_Log', level: 12, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gary' },
  { id: 'u_lisa', username: 'LisaLogs', level: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
  { id: 'u_bob', username: 'BobBuilder', level: 32, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  { id: 'u_sarah', username: 'SarahStomach', level: 8, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'u_mike', username: 'MikeDrop', level: 45, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
];

// --- HELPER TO MERGE REAL + MOCK ---
const getCombinedUserDB = (excludeId?: string): FriendProfile[] => {
    const realUsers = getAllUsers()
        .filter(u => u.id !== excludeId)
        .map(u => ({
            id: u.id,
            username: u.username,
            level: u.level || 1,
            avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`
        }));

    const combined = [...MOCK_DATABASE_USERS];
    realUsers.forEach(realUser => {
        if (!combined.find(c => c.id === realUser.id)) combined.push(realUser);
    });

    return combined.filter(u => u.id !== excludeId);
};

export const searchUsers = async (query: string, currentUserId?: string): Promise<FriendProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (!query) return [];
  const lowerQ = query.toLowerCase();
  const allUsers = getCombinedUserDB(currentUserId);
  return allUsers.filter(u => u.username.toLowerCase().includes(lowerQ) || u.id.toLowerCase().includes(lowerQ));
};

export const getFriendsByIds = async (friendIds: string[]): Promise<FriendProfile[]> => {
   await new Promise(resolve => setTimeout(resolve, 200));
   const allUsers = getCombinedUserDB();
   return allUsers.filter(u => friendIds.includes(u.id));
};

export const getFriendRequests = async (requestIds: string[]): Promise<FriendProfile[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const allUsers = getCombinedUserDB();
    return allUsers.filter(u => requestIds.includes(u.id));
};

export const sendFriendRequest = async (currentUser: User, targetUserId: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (currentUser.id === targetUserId) return currentUser;
    if (currentUser.outgoingRequests?.includes(targetUserId)) return currentUser;

    const isMock = targetUserId.startsWith('u_');
    const updatedUser = { 
        ...currentUser, 
        outgoingRequests: [...(currentUser.outgoingRequests || []), targetUserId] 
    };
    updateUserProfile(updatedUser);

    if (isMock) {
        setTimeout(() => {
            const freshUser = getUserById(currentUser.id);
            if (freshUser && freshUser.outgoingRequests?.includes(targetUserId)) {
                const newOutgoing = (freshUser.outgoingRequests || []).filter(id => id !== targetUserId);
                const newFriends = Array.from(new Set([...(freshUser.friends || []), targetUserId]));
                updateUserProfile({ ...freshUser, friends: newFriends, outgoingRequests: newOutgoing });
                
                if ('Notification' in window && Notification.permission === 'granted') {
                    const mockName = MOCK_DATABASE_USERS.find(u => u.id === targetUserId)?.username || 'Friend';
                    new Notification("DooDoo Log", { body: `${mockName} accepted your friend request!` });
                }
            }
        }, 2000);
    } else {
        const targetUser = getUserById(targetUserId);
        if (targetUser) {
            const newRequests = Array.from(new Set([...(targetUser.friendRequests || []), currentUser.id]));
            updateOtherUser({ ...targetUser, friendRequests: newRequests });
        }
    }
    return updatedUser;
};

export const cancelFriendRequest = async (currentUser: User, targetUserId: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newOutgoing = (currentUser.outgoingRequests || []).filter(id => id !== targetUserId);
    const updatedUser = { ...currentUser, outgoingRequests: newOutgoing };
    updateUserProfile(updatedUser);

    if (!targetUserId.startsWith('u_')) {
        const targetUser = getUserById(targetUserId);
        if (targetUser) {
            const newRequests = (targetUser.friendRequests || []).filter(id => id !== currentUser.id);
            updateOtherUser({ ...targetUser, friendRequests: newRequests });
        }
    }
    return updatedUser;
};

export const acceptFriendRequest = async (currentUser: User, requesterId: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newRequests = (currentUser.friendRequests || []).filter(id => id !== requesterId);
    const newFriends = Array.from(new Set([...(currentUser.friends || []), requesterId]));
    const updatedUser = { ...currentUser, friendRequests: newRequests, friends: newFriends };
    updateUserProfile(updatedUser);

    const requester = getUserById(requesterId);
    if (requester) {
        const theirOutgoing = (requester.outgoingRequests || []).filter(id => id !== currentUser.id);
        const theirFriends = Array.from(new Set([...(requester.friends || []), currentUser.id]));
        updateOtherUser({ ...requester, outgoingRequests: theirOutgoing, friends: theirFriends });
    }
    return updatedUser;
};

export const denyFriendRequest = async (currentUser: User, requesterId: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newRequests = (currentUser.friendRequests || []).filter(id => id !== requesterId);
    const updatedUser = { ...currentUser, friendRequests: newRequests };
    updateUserProfile(updatedUser);

    const requester = getUserById(requesterId);
    if (requester) {
        const theirOutgoing = (requester.outgoingRequests || []).filter(id => id !== currentUser.id);
        updateOtherUser({ ...requester, outgoingRequests: theirOutgoing });
    }
    return updatedUser;
};

export const getFriendFeed = async (currentUser: User): Promise<FriendLog[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const friendIds = currentUser.friends || [];
  if (friendIds.length === 0) return [];
  const friends = getCombinedUserDB().filter(u => friendIds.includes(u.id));
  const feed: FriendLog[] = [];
  const now = Date.now();
  friends.forEach(friend => {
    const seed = friend.id.charCodeAt(0) + new Date().getHours() + friend.level;
    if (seed % 10 > 1) {
        feed.push({
            id: `log_${friend.id}_${now}_${seed}`,
            timestamp: now - ((seed % 24) * 60 * 60 * 1000),
            type: ((seed % 7) + 1) as BristolType,
            notes: ["Intense!", "Better now.", "Morning ritual.", "Fiber helps!", "Smooth."][seed % 5],
            username: friend.username,
            userAvatar: friend.avatar,
            durationMinutes: (seed % 12) + 3,
            reactions: [{ emoji: '💩', count: (seed % 3) + 1, userReacted: false }]
        });
    }
  });
  return feed.sort((a, b) => b.timestamp - a.timestamp);
};
