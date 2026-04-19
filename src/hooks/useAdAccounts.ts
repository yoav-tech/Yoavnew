import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdAccount, Platform } from '@/types/database'

export function useAdAccounts(clientId?: string | null) {
  return useQuery({
    queryKey: ['ad-accounts', clientId ?? null],
    queryFn: async () => {
      let q = supabase.from('ad_accounts').select('*').order('account_name')
      if (clientId) q = q.eq('client_id', clientId)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as AdAccount[]
    },
  })
}

export function useCreateAdAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: {
      client_id: string
      platform: Platform
      account_name: string
      platform_account_id: string
      currency?: string
    }) => {
      const { data, error } = await supabase.from('ad_accounts').insert(values).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-accounts'] }),
  })
}

export function useUpdateAdAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<AdAccount> & { id: string }) => {
      const { data, error } = await supabase.from('ad_accounts').update(values).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-accounts'] }),
  })
}
