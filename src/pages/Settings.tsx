import { useState, FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useClients, useCreateClient, useUpdateClient, useToggleClientActive } from '@/hooks/useClients'
import { useAdAccounts, useCreateAdAccount } from '@/hooks/useAdAccounts'
import { useSyncLog, useTriggerSync } from '@/hooks/useSyncStatus'
import { useUsers, useInviteClientUser } from '@/hooks/useUsers'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { Platform } from '@/types/database'

type Tab = 'clients' | 'accounts' | 'users' | 'sync'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'clients',  label: 'Clients',     icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'accounts', label: 'Ad Accounts', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'users',    label: 'Users',       icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'sync',     label: 'Sync',        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
]

const PLATFORMS: Platform[] = ['meta', 'google', 'tiktok', 'linkedin']

function formatTs(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

function InputField({
  label, value, onChange, type = 'text', required = false, placeholder = ''
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; required?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-violet-500 transition-colors"
      />
    </div>
  )
}

function PrimaryBtn({ children, disabled, type = 'button', onClick }: {
  children: React.ReactNode; disabled?: boolean; type?: 'button' | 'submit'; onClick?: () => void
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors">
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition-colors">
      {children}
    </button>
  )
}

export function Settings() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('clients')

  if (profile && profile.role !== 'admin') return <Navigate to="/dashboard" replace />

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-base font-bold text-zinc-100 font-display">Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Manage clients, ad accounts, users, and data sync</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-zinc-800 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t.id
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'clients'  && <ClientsTab />}
      {tab === 'accounts' && <AccountsTab />}
      {tab === 'users'    && <UsersTab />}
      {tab === 'sync'     && <SyncTab />}
    </div>
  )
}

/* ── Clients Tab ─────────────────────────────────────────────────────────── */
function ClientsTab() {
  const { data: clients = [], isLoading } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const toggleActive = useToggleClientActive()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')

  function reset() { setName(''); setSlug(''); setEmail(''); setErr(''); setEditId(null); setShowForm(false) }

  function startEdit(c: (typeof clients)[0]) {
    setEditId(c.id); setName(c.name); setSlug(c.slug); setEmail(c.contact_email ?? ''); setShowForm(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setErr('')
    try {
      if (editId) {
        await updateClient.mutateAsync({ id: editId, name, slug, contact_email: email || undefined })
      } else {
        await createClient.mutateAsync({ name, slug, contact_email: email || undefined })
      }
      reset()
    } catch (ex) { setErr((ex as Error).message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-zinc-500">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        <PrimaryBtn onClick={() => setShowForm(!showForm)}>+ New Client</PrimaryBtn>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200">{editId ? 'Edit Client' : 'New Client'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InputField label="Name" value={name} onChange={setName} required />
            <InputField label="Slug" value={slug} onChange={(v) => setSlug(v.toLowerCase().replace(/\s+/g, '-'))} required />
            <InputField label="Contact Email" value={email} onChange={setEmail} type="email" />
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2">
            <PrimaryBtn type="submit" disabled={createClient.isPending || updateClient.isPending}>
              {editId ? 'Save Changes' : 'Create Client'}
            </PrimaryBtn>
            <GhostBtn onClick={reset}>Cancel</GhostBtn>
          </div>
        </form>
      )}

      {isLoading ? <PageLoader /> : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Name', 'Slug', 'Email', 'Status', ''].map((h) => (
                  <th key={h} className="text-left text-zinc-500 font-semibold p-3 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-3 text-zinc-200 font-medium">{c.name}</td>
                  <td className="p-3 text-zinc-500 font-mono text-[11px]">{c.slug}</td>
                  <td className="p-3 text-zinc-400">{c.contact_email ?? '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${c.is_active ? 'bg-emerald-950/50 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => startEdit(c)} className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors">Edit</button>
                      <button onClick={() => toggleActive.mutate({ id: c.id, is_active: !c.is_active })} className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Ad Accounts Tab ─────────────────────────────────────────────────────── */
function AccountsTab() {
  const { data: clients = [] } = useClients()
  const { data: accounts = [], isLoading } = useAdAccounts()
  const createAccount = useCreateAdAccount()
  const [showForm, setShowForm] = useState(false)
  const [clientId, setClientId] = useState('')
  const [platform, setPlatform] = useState<Platform>('meta')
  const [accountName, setAccountName] = useState('')
  const [platformAccountId, setPlatformAccountId] = useState('')
  const [err, setErr] = useState('')

  function reset() { setClientId(''); setPlatform('meta'); setAccountName(''); setPlatformAccountId(''); setErr(''); setShowForm(false) }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setErr('')
    try {
      await createAccount.mutateAsync({ client_id: clientId, platform, account_name: accountName, platform_account_id: platformAccountId })
      reset()
    } catch (ex) { setErr((ex as Error).message) }
  }

  const PLATFORM_COLORS: Record<string, string> = {
    meta: '#1877F2', google: '#EA4335', tiktok: '#FE2C55', linkedin: '#0A66C2',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-zinc-500">{accounts.length} ad account{accounts.length !== 1 ? 's' : ''}</p>
        <PrimaryBtn onClick={() => setShowForm(!showForm)}>+ New Account</PrimaryBtn>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200">New Ad Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors">
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors">
                {PLATFORMS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <InputField label="Account Name" value={accountName} onChange={setAccountName} required />
            <InputField label="Platform Account ID" value={platformAccountId} onChange={setPlatformAccountId} required />
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2">
            <PrimaryBtn type="submit" disabled={createAccount.isPending}>Create Account</PrimaryBtn>
            <GhostBtn onClick={reset}>Cancel</GhostBtn>
          </div>
        </form>
      )}

      {isLoading ? <PageLoader /> : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Account', 'Platform', 'Platform ID', 'Client', 'Status'].map((h) => (
                  <th key={h} className="text-left text-zinc-500 font-semibold p-3 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {accounts.map((a) => {
                const color = PLATFORM_COLORS[a.platform] ?? '#7C3AED'
                return (
                  <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3 text-zinc-200 font-medium">{a.account_name}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize"
                        style={{ background: color + '18', color }}>
                        {a.platform}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-500 font-mono text-[11px]">{a.platform_account_id}</td>
                    <td className="p-3 text-zinc-400">{clients.find((c) => c.id === a.client_id)?.name ?? a.client_id}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${a.is_active ? 'bg-emerald-950/50 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Users Tab ───────────────────────────────────────────────────────────── */
function UsersTab() {
  const { data: clients = [] } = useClients()
  const { data: users = [], isLoading } = useUsers()
  const invite = useInviteClientUser()
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [clientId, setClientId] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')

  function reset() { setEmail(''); setDisplayName(''); setClientId(''); setPassword(''); setErr(''); setShowForm(false) }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setErr(''); setSuccess('')
    try {
      await invite.mutateAsync({ email, display_name: displayName, client_id: clientId, password })
      setSuccess(`Invited ${email} successfully.`)
      reset()
    } catch (ex) { setErr((ex as Error).message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-zinc-500">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        <PrimaryBtn onClick={() => setShowForm(!showForm)}>+ Invite User</PrimaryBtn>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 rounded-xl px-3.5 py-2.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200">Invite Client User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField label="Email" value={email} onChange={setEmail} type="email" required />
            <InputField label="Display Name" value={displayName} onChange={setDisplayName} required />
            <InputField label="Password" value={password} onChange={setPassword} type="password" required />
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors">
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2">
            <PrimaryBtn type="submit" disabled={invite.isPending}>Send Invite</PrimaryBtn>
            <GhostBtn onClick={reset}>Cancel</GhostBtn>
          </div>
        </form>
      )}

      {isLoading ? <PageLoader /> : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Name', 'Role', 'Client', 'Created'].map((h) => (
                  <th key={h} className="text-left text-zinc-500 font-semibold p-3 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-3 text-zinc-200 font-medium">{u.display_name ?? '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${u.role === 'admin' ? 'bg-violet-950/50 text-violet-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-400">{clients.find((c) => c.id === u.client_id)?.name ?? '—'}</td>
                  <td className="p-3 text-zinc-500">{formatTs(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Sync Tab ────────────────────────────────────────────────────────────── */
function SyncTab() {
  const { data: logs = [], isLoading } = useSyncLog()
  const { mutate: triggerSync, isPending } = useTriggerSync()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-zinc-500">Last 20 sync runs</p>
        <button
          onClick={() => triggerSync()}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <svg className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isPending ? 'Syncing…' : 'Manual Sync'}
        </button>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Type', 'Status', 'Started', 'Completed', 'Rows', 'Error'].map((h) => (
                  <th key={h} className="text-left text-zinc-500 font-semibold p-3 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-600 text-xs">No sync logs yet</td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-3 text-zinc-300 capitalize">{log.sync_type}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      log.status === 'completed' ? 'bg-emerald-950/50 text-emerald-400' :
                      log.status === 'failed'    ? 'bg-red-950/50 text-red-400' :
                                                   'bg-amber-950/50 text-amber-400'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-400">{formatTs(log.started_at)}</td>
                  <td className="p-3 text-zinc-400">{formatTs(log.completed_at)}</td>
                  <td className="p-3 text-zinc-400 tabular">{log.rows_synced}</td>
                  <td className="p-3 text-red-400 max-w-xs truncate">{log.error_message ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
