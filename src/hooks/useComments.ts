import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Comment } from '@/lib/types'

export function useComments(sundayId: number | undefined) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchComments = useCallback(async () => {
    if (!sundayId) { setLoading(false); return }

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('sunday_id', sundayId)
      .order('created_at', { ascending: true })

    if (!error && data) setComments(data)
    setLoading(false)
  }, [sundayId])

  useEffect(() => { fetchComments() }, [fetchComments])

  const addComment = async (
    author: string,
    content: string,
    userId: string
  ) => {
    if (!sundayId) return { error: new Error('No sunday selected') }

    const { error } = await supabase.from('comments').insert({
      sunday_id: sundayId,
      author,
      content,
      user_id: userId,
    })

    if (!error) await fetchComments()
    return { error }
  }

  const deleteComment = async (commentId: number) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (!error) await fetchComments()
    return { error }
  }

  return { comments, loading, refetch: fetchComments, addComment, deleteComment }
}
