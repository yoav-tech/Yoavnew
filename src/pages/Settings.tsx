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

const TABS: { id: Tab; label: string }[] = [
  { id: 'clients',  label: 'Clients' },
  { id: 'accounts', label: 'Ad Accounts' },
  { id: 'users',    label: 'Users' },
  { id: 'sync',     label: 'Sync' },
]

const PLATFORMS: Platform[] = ['meta', 'google', 'tiktok', 'linkedin']

function formatTs(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

export function Settings() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('clients')

  if (profile && profile.role !== 'admin') return <Navigate to="/dashboard" replace />

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-lg font-bold text-gray-100">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
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
        <p className="text-sm text-gray-400">{clients.length} clients</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          + New Client
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">{editId ? 'Edit Client' : 'New Client'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slug *</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} required
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contact Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={createClient.isPending || updateClient.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors">
              {editId ? 'Save' : 'Create'}
            </button>
            <button type="button" onClick={reset} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? <PageLoader /> : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Name', 'Slug', 'Email', 'Status', ''].map((h) => (
                  <th key={h} className="text-left text-gray-500 font-medium p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200 font-medium">{c.name}</td>
                  <td className="p-3 text-gray-400 font-mono">{c.slug}</td>
                  <td className="p-3 text-gray-400">{c.contact_email ?? '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.is_active ? 'bg-green-950 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-indigo-400 hover:text-indigo-300 text-xs">Edit</button>
                      <button onClick={() => toggleActive.mutate({ id: c.id, is_active: !c.is_active })} className="text-gray-500 hover:text-gray-300 text-xs">
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400">{accounts.length} ad accounts</p>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors">
          + New Account
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">New Ad Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Client *</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} required
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500">
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Platform *</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500">
                {PLATFORMS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Account Name *</label>
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} required
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Platform Account ID *</label>
              <input value={platformAccountId} onChange={(e) => setPlatformAccountId(e.target.value)} required
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={createAccount.isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-medium rounded-lg">Create</button>
            <button type="button" onClick={reset} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <PageLoader /> : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Account', 'Platform', 'Platform ID', 'Client', 'Status'].map((h) => (
                  <th key={h} className="text-left text-gray-500 font-medium p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200 font-medium">{a.account_name}</td>
                  <td className="p-3 text-gray-400 capitalize">{a.platform}</td>
                  <td className="p-3 text-gray-400 font-mono">{a.platform_account_id}</td>
                  <td className="p-3 text-gray-400">{clients.find((c) => c.id === a.client_id)?.name ?? a.client_id}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.is_active ? 'bg-green-950 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
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
        <p className="text-sm text-gray-400">{users.length} users</p>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg">
          + Invite User
        </button>
      </div>

      {success && <div className="text-xs text-green-400 bg-green-950 border border-green-800 rounded-lg px-3 py-2">{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Invite Client User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Email *', value: email, onChange: setEmail, type: 'email' },
              { label: 'Display Name *', value: displayName, onChange: setDisplayName, type: 'text' },
              { label: 'Password *', value: password, onChange: setPassword, type: 'password' },
            ].map(({ label, value, onChange, type }) => (
              <div key={label}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Client *</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} required
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500">
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={invite.isPending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-medium rounded-lg">Invite</button>
            <button type="button" onClick={reset} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <PageLoader /> : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Name', 'Role', 'Client', 'Created'].map((h) => (
                  <th key={h} className="text-left text-gray-500 font-medium p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200 font-medium">{u.display_name ?? '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-indigo-950 text-indigo-400' : 'bg-gray-800 text-gray-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">{clients.find((c) => c.id === u.client_id)?.name ?? '—'}</td>
                  <td className="p-3 text-gray-500">{formatTs(u.created_at)}</td>
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
        <p className="text-sm text-gray-400">Last 20 sync runs</p>
        <button
          onClick={() => triggerSync()}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <svg className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isPending ? 'Syncing…' : 'Manual Sync'}
        </button>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Type', 'Status', 'Started', 'Completed', 'Rows', 'Error'].map((h) => (
                  <th key={h} className="text-left text-gray-500 font-medium p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No sync logs yet</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-300 capitalize">{log.sync_type}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      log.status === 'completed' ? 'bg-green-950 text-green-400' :
                      log.status === 'failed' ? 'bg-red-950 text-red-400' :
                      'bg-amber-950 text-amber-400'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">{formatTs(log.started_at)}</td>
                  <td className="p-3 text-gray-400">{formatTs(log.completed_at)}</td>
                  <td className="p-3 text-gray-400">{log.rows_synced}</td>
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
