import { supabase } from '../utils/supabase';
import { FriendLog, FriendProfile, User, BristolType } from '../types';

// Helper to map DB profile to FriendProfile
const mapProfile = (p: any): FriendProfile => ({
    id: p.id,
    username: p.username,
    avatar: p.avatar_url,
    level: p.level || 1
});

export const searchUsers = async (query: string, currentUserId?: string): Promise<FriendProfile[]> => {
    if (!query) return [];
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(10);

    if (!data) return [];
    return data
        .filter(u => u.id !== currentUserId)
        .map(mapProfile);
};

export const getFriendsByIds = async (friendIds: string[]): Promise<FriendProfile[]> => {
    if (friendIds.length === 0) return [];
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);
    return data?.map(mapProfile) || [];
};

export const getFriendRequests = async (requestIds: string[]): Promise<FriendProfile[]> => {
    // Note: requestIds passed from User object might be stale if we don't refresh User often.
    // Better to fetch fresh requests from DB.
    if (requestIds.length === 0) return [];
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', requestIds);
    return data?.map(mapProfile) || [];
};

export const sendFriendRequest = async (currentUser: User, targetUserId: string): Promise<User> => {
    // Check if already friends or requested
    const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUser.id})`);

    if (existing && existing.length > 0) return currentUser; // Already exists

    const { error } = await supabase
        .from('friendships')
        .insert({
            user_id: currentUser.id,
            friend_id: targetUserId,
            status: 'pending'
        });

    if (error) throw error;

    // Return updated user state (optimistic)
    return {
        ...currentUser,
        outgoingRequests: [...(currentUser.outgoingRequests || []), targetUserId]
    };
};

export const cancelFriendRequest = async (currentUser: User, targetUserId: string): Promise<User> => {
    const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('friend_id', targetUserId);

    if (error) throw error;

    return {
        ...currentUser,
        outgoingRequests: (currentUser.outgoingRequests || []).filter(id => id !== targetUserId)
    };
};

export const acceptFriendRequest = async (currentUser: User, requesterId: string): Promise<User> => {
    const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('user_id', requesterId)
        .eq('friend_id', currentUser.id);

    if (error) throw error;

    return {
        ...currentUser,
        friendRequests: (currentUser.friendRequests || []).filter(id => id !== requesterId),
        friends: [...(currentUser.friends || []), requesterId]
    };
};

export const denyFriendRequest = async (currentUser: User, requesterId: string): Promise<User> => {
    const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', requesterId)
        .eq('friend_id', currentUser.id);

    if (error) throw error;

    return {
        ...currentUser,
        friendRequests: (currentUser.friendRequests || []).filter(id => id !== requesterId)
    };
};

export const getFriendFeed = async (currentUser: User): Promise<FriendLog[]> => {
    const friendIds = currentUser.friends || [];
    if (friendIds.length === 0) return [];

    const { data, error } = await supabase
        .from('poop_logs')
        .select(`
        *,
        profiles (
            username,
            avatar_url
        )
    `)
        .in('user_id', friendIds)
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Feed error:", error);
        return [];
    }

    return data.map((log: any) => ({
        id: log.id,
        timestamp: new Date(log.created_at).getTime(),
        type: log.type as BristolType,
        notes: log.notes,
        durationMinutes: log.duration_minutes,
        username: log.profiles?.username || 'Unknown',
        userAvatar: log.profiles?.avatar_url,
        reactions: [], // Reactions would need a separate table/join, simplified for now

        // Mapped fields
        painLevel: log.pain_level,
        wipes: log.wipes,
        isClog: log.is_clog,
        size: log.size,
        hasBlood: log.has_blood,
        xpGained: log.xp_gained,
        isPrivate: log.is_private,
        aiCommentary: log.ai_commentary
    }));
};

