export interface Song {
  id: number
  number: number
  name: string
  is_playable: boolean
  is_ready: boolean
  notes: string | null
  drive_folder_id: string | null
  created_at: string
}

export interface Sunday {
  id: number
  date: string
  notes: string | null
  created_at: string
}

export interface SundaySong {
  id: number
  sunday_id: number
  song_id: number
  position: number
  created_at: string
  song?: Song
}

export interface Suggestion {
  id: number
  song_name: string
  artist: string | null
  suggested_by: string
  reason: string | null
  link: string | null
  status: 'pendente' | 'aprovada' | 'rejeitada'
  created_at: string
}

export interface Comment {
  id: number
  sunday_id: number
  author: string
  content: string
  created_at: string
}

export interface SundayWithSongs extends Sunday {
  sunday_songs: (SundaySong & { song: Song })[]
}

export interface SongWithStats extends Song {
  executions: number
  days_since_last: number
  last_played: string | null
  dates_played: string[]
}

export interface ApprovedUser {
  id: number
  email: string
  name: string | null
  created_at: string
}

export interface AccessRequest {
  id: number
  email: string
  message: string | null
  status: 'pending' | 'approved' | 'denied'
  created_at: string
  updated_at: string
}

export type UserRole = 'admin' | 'approved' | null

export type SongFilter =
  | 'all'
  | 'playable'
  | 'not_playable'
  | 'not_ready'
  | 'never_played'
  | 'forgotten'
