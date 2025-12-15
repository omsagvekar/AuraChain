// src/lib/auraService.js
// Service for handling Aura Points operations

import { supabase } from './supabaseClient'

/**
 * Add aura points to a user's profile
 * Uses database function for atomic updates
 * 
 * @param {string} userId - User ID to add points to
 * @param {number} points - Points to add
 * @param {string} sourceType - Source of points (e.g., 'boost', 'comment', 'share', 'post')
 * @param {object} sourceMeta - Additional metadata (e.g., {post_id: '...'})
 * @returns {Promise<number>} New aura score
 */
export async function addAuraPoints(userId, points, sourceType = 'system', sourceMeta = {}) {
  try {
    // Use database function for atomic update
    const { data, error } = await supabase.rpc('add_aura_points', {
      target_user_id: userId,
      points_to_add: points,
      source_type: sourceType,
      source_meta: sourceMeta
    })

    if (error) {
      console.error('Error adding aura points:', error)
      // Fallback: manual update if function doesn't exist
      return await addAuraPointsFallback(userId, points, sourceType, sourceMeta)
    }

    return data || 0
  } catch (error) {
    console.error('Error in addAuraPoints:', error)
    return await addAuraPointsFallback(userId, points, sourceType, sourceMeta)
  }
}

/**
 * Fallback method if database function doesn't exist
 * Less safe (race conditions possible) but works for MVP
 */
async function addAuraPointsFallback(userId, points, sourceType = 'system', sourceMeta = {}) {
  try {
    // Get current score
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('aura_score')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching profile:', fetchError)
      return 0
    }

    const newScore = (profile?.aura_score || 0) + points

    // Update score
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ aura_score: newScore })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating aura score:', updateError)
      return profile?.aura_score || 0
    }

    // Optionally log to points_ledger if table exists
    try {
      await supabase.from('points_ledger').insert({
        user_id: userId,
        source: sourceType,
        amount: points,
        meta: sourceMeta
      })
    } catch (ledgerError) {
      // Ignore if points_ledger doesn't exist or insert fails
      console.log('Could not log to points_ledger:', ledgerError)
    }

    return newScore
  } catch (error) {
    console.error('Error in addAuraPointsFallback:', error)
    return 0
  }
}

/**
 * Award points for post creation
 * Called when a post is successfully created
 * 
 * @param {string} postId - Post ID
 * @param {string} userId - Post owner ID
 * @returns {Promise<boolean>} Success status
 */
export async function awardPostCreationPoints(postId, userId) {
  try {
    // Update post aura_points
    const { error: postError } = await supabase
      .from('posts')
      .update({ aura_points: 5 })
      .eq('id', postId)

    if (postError) {
      console.error('Error updating post aura_points:', postError)
      return false
    }

    // Add to user's aura_score
    await addAuraPoints(userId, 5, 'post_creation', { post_id: postId })
    return true
  } catch (error) {
    console.error('Error in awardPostCreationPoints:', error)
    return false
  }
}

/**
 * Boost a post (uses 'likes' table in your schema)
 * Awards +2 aura points to post owner
 * 
 * @param {string} postId - Post ID
 * @param {string} userId - User ID boosting
 * @param {string} postOwnerId - Post owner ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function boostPost(postId, userId, postOwnerId) {
  try {
    // Check: User cannot boost their own post
    if (userId === postOwnerId) {
      return { success: false, error: 'Cannot boost your own post' }
    }

    // Check if already boosted (using 'likes' table)
    const { data: existing, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing boost:', checkError)
      // Check if table doesn't exist (common error codes)
      if (checkError.code === '42P01' || checkError.message?.includes('does not exist')) {
        return { 
          success: false, 
          error: 'Likes table not found. Please run the migration script.' 
        }
      }
      // Check if RLS policy issue
      if (checkError.code === '42501' || checkError.message?.includes('permission denied')) {
        return { 
          success: false, 
          error: 'Permission denied. Please check RLS policies on the likes table.' 
        }
      }
      return { success: false, error: `Failed to check boost status: ${checkError.message || 'Unknown error'}` }
    }

    if (existing) {
      return { success: false, error: 'Already boosted this post' }
    }

    // Insert boost (using 'likes' table)
    const { error: insertError } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: userId
      })

    if (insertError) {
      console.error('Error inserting boost:', insertError)
      // Check for duplicate boost (UNIQUE constraint)
      if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
        return { success: false, error: 'You have already boosted this post' }
      }
      // Check if table doesn't exist
      if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
        return { 
          success: false, 
          error: 'Likes table not found. Please run the migration script.' 
        }
      }
      return { success: false, error: `Failed to boost post: ${insertError.message || 'Unknown error'}` }
    }

    // Award aura points to post owner
    await addAuraPoints(postOwnerId, 2, 'boost', { post_id: postId })

    return { success: true }
  } catch (error) {
    console.error('Error in boostPost:', error)
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Remove boost from a post (uses 'likes' table)
 * Removes +2 aura points from post owner
 * 
 * @param {string} postId - Post ID
 * @param {string} userId - User ID removing boost
 * @param {string} postOwnerId - Post owner ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function unboostPost(postId, userId, postOwnerId) {
  try {
    // Delete boost (using 'likes' table)
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting boost:', deleteError)
      return { success: false, error: 'Failed to remove boost' }
    }

    // Remove aura points from post owner
    await addAuraPoints(postOwnerId, -2, 'unboost', { post_id: postId })

    return { success: true }
  } catch (error) {
    console.error('Error in unboostPost:', error)
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Add a comment to a post (uses 'body' column in your schema)
 * Awards +3 aura points to post owner
 * 
 * @param {string} postId - Post ID
 * @param {string} userId - User ID commenting
 * @param {string} content - Comment text
 * @param {string} postOwnerId - Post owner ID
 * @returns {Promise<{success: boolean, comment?: object, error?: string}>}
 */
export async function addComment(postId, userId, content, postOwnerId) {
  try {
    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Comment cannot be empty' }
    }

    // Insert comment (using 'body' column)
    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        body: content.trim()  // Using 'body' instead of 'content'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting comment:', insertError)
      return { success: false, error: 'Failed to add comment' }
    }

    // Award aura points to post owner (only if not own post)
    if (userId !== postOwnerId) {
      await addAuraPoints(postOwnerId, 3, 'comment', { post_id: postId, comment_id: comment.id })
    }

    return { success: true, comment }
  } catch (error) {
    console.error('Error in addComment:', error)
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Share a post
 * Awards +4 aura points to post owner
 * 
 * @param {string} postId - Post ID
 * @param {string} userId - User ID sharing
 * @param {string} postOwnerId - Post owner ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sharePost(postId, userId, postOwnerId) {
  try {
    // Check if already shared (optional - remove if you want to allow multiple shares)
    const { data: existing, error: checkError } = await supabase
      .from('shares')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing share:', checkError)
      // Continue anyway - allow sharing
    }

    if (existing) {
      // Already shared - still award points (or return success without duplicate)
      return { success: true }
    }

    // Insert share
    const { error: insertError } = await supabase
      .from('shares')
      .insert({
        post_id: postId,
        user_id: userId
      })

    if (insertError) {
      console.error('Error inserting share:', insertError)
      return { success: false, error: 'Failed to record share' }
    }

    // Award aura points to post owner (only if not own post)
    if (userId !== postOwnerId) {
      await addAuraPoints(postOwnerId, 4, 'share', { post_id: postId })
    }

    return { success: true }
  } catch (error) {
    console.error('Error in sharePost:', error)
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Get engagement counts for a post
 * 
 * @param {string} postId - Post ID
 * @returns {Promise<{boosts: number, comments: number, shares: number, hasBoosted: boolean}>}
 */
export async function getPostEngagement(postId, currentUserId) {
  try {
    // Use 'likes' table instead of 'boosts'
    const [boostsResult, commentsResult, sharesResult, userBoostResult] = await Promise.all([
      supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', postId),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', postId),
      supabase.from('shares').select('id', { count: 'exact', head: true }).eq('post_id', postId),
      currentUserId 
        ? supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', currentUserId).maybeSingle()
        : Promise.resolve({ data: null })
    ])

    // Handle errors gracefully - if tables don't exist, return zeros
    return {
      boosts: boostsResult.error ? 0 : (boostsResult.count || 0),
      comments: commentsResult.error ? 0 : (commentsResult.count || 0),
      shares: sharesResult.error ? 0 : (sharesResult.count || 0),
      hasBoosted: userBoostResult.error ? false : !!userBoostResult.data
    }
  } catch (error) {
    console.error('Error in getPostEngagement:', error)
    // Return zeros if tables don't exist - allows UI to still work
    return { boosts: 0, comments: 0, shares: 0, hasBoosted: false }
  }
}

