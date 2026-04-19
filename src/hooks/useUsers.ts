import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types/database'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as UserProfile[]
    },
  })
}

export function useInviteClientUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: { email: string; display_name: string; client_id: string; password: string }) => {
      const { error } = await supabase.functions.invoke('create-client-user', { body: values })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
