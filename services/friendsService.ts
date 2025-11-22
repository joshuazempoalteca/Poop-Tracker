import { FriendLog, BristolType, FriendProfile, User } from '../types';
import { BRISTOL_SCALE_DATA } from '../constants';

// --- SIMULATED DATABASE ---
// In a real deployment, this data would come from your Backend API (Firebase/Supabase)
const MOCK_DATABASE_USERS: FriendProfile[] = [
  { id: 'u_gary', username: 'Gary_The_Log', level: 12, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gary' },
  { id: 'u_lisa', username: 'LisaLogs', level: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
  { id: 'u_bob', username: 'BobBuilder', level: 32, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  { id: 'u_sarah', username: 'SarahStomach', level: 8, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'u_mike', username: 'MikeDrop', level: 45, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
];

// --- SERVICE METHODS ---

/**
 * Simulaties searching the "cloud" for a user by username or ID
 */
export const searchUsers = async (query: string): Promise<FriendProfile[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (!query) return [];
  const lowerQ = query.toLowerCase();
  
  return MOCK_DATABASE_USERS.filter(u => 
    u.username.toLowerCase().includes(lowerQ) || 
    u.id.toLowerCase().includes(lowerQ)
  );
};

/**
 * Gets the full profile objects for a list of IDs
 */
export const getFriendsByIds = async (friendIds: string[]): Promise<FriendProfile[]> => {
   // Simulate network delay
   await new Promise(resolve => setTimeout(resolve, 300));
   return MOCK_DATABASE_USERS.filter(u => friendIds.includes(u.id));
};

/**
 * Generates a feed SPECIFIC to the users in your friend list.
 * This makes the feed dynamic based on who you follow.
 */
export const getFriendFeed = async (currentUser: User): Promise<FriendLog[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const friendIds = currentUser.friends || [];
  
  if (friendIds.length === 0) {
    return [];
  }

  const friends = MOCK_DATABASE_USERS.filter(u => friendIds.includes(u.id));
  const feed: FriendLog[] = [];
  const now = Date.now();

  // Generate dynamic logs for ONLY these friends
  friends.forEach(friend => {
    // Deterministic pseudo-random based on friend ID and current hour to keep it stable-ish
    const seed = friend.id.charCodeAt(0) + new Date().getHours();
    
    // 70% chance a friend posted today
    if (seed % 10 > 2) {
        feed.push({
            id: `log_${friend.id}_${now}`,
            timestamp: now - (Math.random() * 1000 * 60 * 60 * 5), // Random time in last 5 hours
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
  });

  return feed.sort((a, b) => b.timestamp - a.timestamp);
};

// Helper for fun notes
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