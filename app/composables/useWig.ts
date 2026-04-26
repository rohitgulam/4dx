type WigPayload = {
  title: string
  description?: string | null
  unit: string
  startValue: number
  currentValue: number
  targetValue: number
  deadline: string
  completed?: boolean
}

export type WigRecord = WigPayload & {
  id: string
  completedAt: string | null
  workspaceId: string
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export function useWig() {
  const wig = useState<WigRecord | null>('wig-record', () => null)
  const wigs = useState<WigRecord[]>('wig-records', () => [])
  const pending = useState('wig-pending', () => false)

  async function fetchWigs() {
    pending.value = true

    try {
      const response = await $fetch<{ wigs: WigRecord[] }>('/api/wigs')
      wigs.value = response.wigs
      wig.value = response.wigs[0] ?? null
      return response.wigs
    } finally {
      pending.value = false
    }
  }

  async function fetchWig(id?: string) {
    const records = wigs.value.length > 0 ? wigs.value : await fetchWigs()

    const selected = id ? records.find(record => record.id === id) ?? null : records[0] ?? null
    wig.value = selected
    return selected
  }

  async function createWig(payload: WigPayload) {
    pending.value = true

    try {
      const response = await $fetch<{ wig: WigRecord }>('/api/wigs', {
        method: 'POST',
        body: payload
      })

      wig.value = response.wig
      wigs.value = [response.wig, ...wigs.value]
      return response.wig
    } finally {
      pending.value = false
    }
  }

  async function updateWig(id: string, payload: Partial<WigPayload>) {
    pending.value = true

    try {
      const response = await $fetch<{ wig: WigRecord }>(`/api/wigs/${id}`, {
        method: 'PATCH',
        body: payload
      })

      wig.value = response.wig
      wigs.value = wigs.value.map(existing => existing.id === id ? response.wig : existing)
      return response.wig
    } finally {
      pending.value = false
    }
  }

  async function deleteWig(id: string) {
    pending.value = true

    try {
      await $fetch<{ success: true }>(`/api/wigs/${id}`, {
        method: 'DELETE'
      })

      wigs.value = wigs.value.filter(existing => existing.id !== id)

      if (wig.value?.id === id) {
        wig.value = null
      }
    } finally {
      pending.value = false
    }
  }

  return {
    wig,
    wigs,
    pending,
    fetchWigs,
    fetchWig,
    createWig,
    updateWig,
    deleteWig
  }
}
