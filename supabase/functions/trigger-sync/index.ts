import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify caller is admin
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
    }

    // Log sync start
    const { data: log } = await supabase
      .from('sync_log')
      .insert({ sync_type: 'manual', status: 'started' })
      .select()
      .single()

    try {
      // Call Windsor.ai API for manual sync
      const windsorKey = Deno.env.get('WINDSOR_API_KEY')
      if (windsorKey) {
        // Windsor.ai webhook or sync trigger — adapt endpoint as needed
        await fetch(`https://connectors.windsor.ai/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${windsorKey}` },
          body: JSON.stringify({ trigger: 'manual_sync' }),
        })
      }

      // Refresh materialized views after sync
      await supabase.rpc('refresh_materialized_views')

      await supabase
        .from('sync_log')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', log?.id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (syncErr) {
      await supabase
        .from('sync_log')
        .update({ status: 'failed', completed_at: new Date().toISOString(), error_message: (syncErr as Error).message })
        .eq('id', log?.id)
      throw syncErr
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
