import { useFilters } from '@/contexts/FiltersContext'
import { useClients } from '@/hooks/useClients'

export function ClientFilter() {
  const { clientId, setClientId } = useFilters()
  const { data: clients = [] } = useClients()

  return (
    <select
      value={clientId ?? ''}
      onChange={(e) => setClientId(e.target.value || null)}
      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
    >
      <option value="">All clients</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
