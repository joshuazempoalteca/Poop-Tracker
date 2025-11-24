
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
const getCombinedUserDB = (): FriendProfile[] => {
    // 1. Get real registered users from auth service
    const realUsers = getAllUsers().map(u => ({
        id: u.id,
        username: u.username,
        level: u.level || 1,
        avatar: u.avatar
    }));

    // 2. Combine with Mock users
    const combined = [...MOCK_DATABASE_USERS];
    
    realUsers.forEach(realUser => {
        if (!combined.find(c => c.id === realUser.id)) {
            combined.push(realUser);
        }
    });

    return combined;
};

// --- SERVICE METHODS ---

export const searchUsers = async (query: string): Promise<FriendProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (!query) return [];
  const lowerQ = query.toLowerCase();
  
  const allUsers = getCombinedUserDB();

  return allUsers.filter(u => 
    u.username.toLowerCase().includes(lowerQ) || 
    u.id.toLowerCase().includes(lowerQ)
  );
};

export const getFriendsByIds = async (friendIds: string[]): Promise<FriendProfile[]> => {
   await new Promise(resolve => setTimeout(resolve, 300));
   const allUsers = getCombinedUserDB();
   return allUsers.filter(u => friendIds.includes(u.id));
};

export const getFriendRequests = async (requestIds: string[]): Promise<FriendProfile[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allUsers = getCombinedUserDB();
    return allUsers.filter(u => requestIds.includes(u.id));
};

// --- REQUEST LOGIC ---

export const sendFriendRequest = async (currentUser: User, targetUserId: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 400)); // Sim network

    // 1. Handle Mock Users (Auto-accept after delay logic simulated here or in UI)
    // Actually, let's simulate the network request behavior.
    const isMock = targetUserId.startsWith('u_');

    if (isMock) {
        // Mock users automatically "accept" after a few seconds.
        // For immediate UX, we will just add to Outgoing. 
        // We can simulate an "async accept" by returning the updated user with outgoing request,
        // and using a setTimeout to "receive" the acceptance later (which updates the DB).
        
        const updatedUser = { 
            ...currentUser, 
            outgoingRequests: [...(currentUser.outgoingRequests || []), targetUserId] 
        };
        updateUserProfile(updatedUser);

        // Simulate Mock User Acceptance Logic
        setTimeout(() => {
            const freshUser = getUserById(currentUser.id);
            if (freshUser) {
                // Remove from outgoing, add to friends
                const newOutgoing = (freshUser.outgoingRequests || []).filter(id => id !== targetUserId);
                const newFriends = [...(freshUser.friends || []), targetUserId];
                
                const acceptedUser = { ...freshUser, friends: newFriends, outgoingRequests: newOutgoing };
                updateUserProfile(acceptedUser);
                
                // Trigger a browser notification if supported/enabled
                if ('Notification' in window && Notification.permission === 'granted') {
                    const mockName = MOCK_DATABASE_USERS.find(u => u.id === targetUserId)?.username || 'Friend';
                    new Notification("DooDoo Log", { body: `${mockName} accepted your friend request!` });
                }
            }
        }, 5000); // 5 seconds delay

        return updatedUser;
    } else {
        // 2. Real Users
        // Update Target User
        const targetUser = getUserById(targetUserId);
        if (targetUser) {
            const newRequests = [...(targetUser.friendRequests || [])];
            if (!newRequests.includes(currentUser.id)) {
                newRequests.push(currentUser.id);
                updateOtherUser({ ...targetUser, friendRequests: newRequests });
            }
        }

        // Update Current User
        const updatedUser = {
            ...currentUser,
            outgoingRequests: [...(currentUser.outgoingRequests || []), targetUserId]
        };
        updateUserProfile(updatedUser);
        
        return updatedUser;
    }
};

export const acceptFriendRequest = async (currentUser: User, requesterId: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    // 1. Update Current User
    const newRequests = (currentUser.friendRequests || []).filter(id => id !== requesterId);
    const newFriends = [...(currentUser.friends || []), requesterId];
    
    const updatedCurrentUser = {
        ...currentUser,
        friendRequests: newRequests,
        friends: newFriends
    };
    updateUserProfile(updatedCurrentUser);

    // 2. Update Requester (if real user)
    const requester = getUserById(requesterId);
    if (requester) {
        const theirOutgoing = (requester.outgoingRequests || []).filter(id => id !== currentUser.id);
        const theirFriends = [...(requester.friends || []), currentUser.id];
        updateOtherUser({ 
            ...requester, 
            outgoingRequests: theirOutgoing,
            friends: theirFriends 
        });
    }

    return updatedCurrentUser;
};

export const denyFriendRequest = async (currentUser: User, requesterId: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    // 1. Update Current User
    const newRequests = (currentUser.friendRequests || []).filter(id => id !== requesterId);
    const updatedCurrentUser = { ...currentUser, friendRequests: newRequests };
    updateUserProfile(updatedCurrentUser);

    // 2. Update Requester (remove from their outgoing)
    const requester = getUserById(requesterId);
    if (requester) {
        const theirOutgoing = (requester.outgoingRequests || []).filter(id => id !== currentUser.id);
        updateOtherUser({ ...requester, outgoingRequests: theirOutgoing });
    }

    return updatedCurrentUser;
};

// --- FEED GENERATION ---

export const getFriendFeed = async (currentUser: User): Promise<FriendLog[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const friendIds = currentUser.friends || [];
  if (friendIds.length === 0) {
    return [];
  }

  const allUsers = getCombinedUserDB();
  const friends = allUsers.filter(u => friendIds.includes(u.id));
  
  const feed: FriendLog[] = [];
  const now = Date.now();

  friends.forEach(friend => {
    // Deterministic pseudo-random based on friend ID and current hour
    const seed = friend.id.charCodeAt(0) + new Date().getHours();
    
    // 70% chance a friend posted today
    if (seed % 10 > 2) {
        // CHECK PRIVACY (Simulated)
        // If this were a real backend, we'd filter `isPrivate` logs here.
        // Since we generate logs on the fly, let's simulate that some logs are private and thus hidden.
        // If (seed % 20 === 0), it's private, so we skip adding it.
        const isPrivate = seed % 20 === 0;

        if (!isPrivate) {
            feed.push({
                id: `log_${friend.id}_${now}`,
                timestamp: now - (Math.random() * 1000 * 60 * 60 * 5),
                type: ((seed % 7) + 1) as BristolType,
                notes: getRandomNote(seed),
                username: friend.username,
                userAvatar: friend.avatar,
                durationMinutes: (seed % 15) + 2,
                reactions: [
                    { emoji: '💩', count: (seed % 5), userReacted: false },
                    { emoji: '🎉', count: (seed % 2), userReacted: false }
                ]
            });
        }
    }
  });

  return feed.sort((a, b) => b.timestamp - a.timestamp);
};

const getRandomNote = (seed: number): string => {
    const notes = [
        "Feeling lighter!",
        "Too much coffee...",
        "Proud of this one.",
        "Rough morning.",
        "Smooth sailing.",
        "Clean sweep!",
        "Need more fiber.",
        ""
    ];
    return notes[seed % notes.length];
};
