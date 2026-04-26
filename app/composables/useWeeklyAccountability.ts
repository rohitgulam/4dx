export type WeeklyAccountabilityRecord = {
  id: string
  wigId: string
  weekStartDate: string
  status: 'winning' | 'at-risk' | 'behind'
  summary: string
  nextCommitment: string | null
  createdAt: string
  updatedAt: string
}

type WeeklyAccountabilityPayload = {
  weekStartDate: string
  status: 'winning' | 'at-risk' | 'behind'
  summary: string
  nextCommitment?: string | null
}

export function useWeeklyAccountability() {
  const entries = useState<WeeklyAccountabilityRecord[]>(
    'weekly-accountability-records',
    () => []
  )
  const pending = useState('weekly-accountability-pending', () => false)

  async function fetchWeeklyAccountability(wigId: string) {
    pending.value = true

    try {
      const response = await $fetch<{ weeklyAccountability: WeeklyAccountabilityRecord[] }>(
        `/api/wigs/${wigId}/weekly-accountability`
      )
      entries.value = response.weeklyAccountability
      return response.weeklyAccountability
    } finally {
      pending.value = false
    }
  }

  async function createWeeklyAccountability(wigId: string, payload: WeeklyAccountabilityPayload) {
    pending.value = true

    try {
      const response = await $fetch<{ weeklyAccountability: WeeklyAccountabilityRecord }>(
        `/api/wigs/${wigId}/weekly-accountability`,
        {
          method: 'POST',
          body: payload
        }
      )

      entries.value = [...entries.value, response.weeklyAccountability]
      return response.weeklyAccountability
    } finally {
      pending.value = false
    }
  }

  async function updateWeeklyAccountability(
    wigId: string,
    weeklyAccountabilityId: string,
    payload: Partial<WeeklyAccountabilityPayload>
  ) {
    pending.value = true

    try {
      const response = await $fetch<{ weeklyAccountability: WeeklyAccountabilityRecord }>(
        `/api/wigs/${wigId}/weekly-accountability/${weeklyAccountabilityId}`,
        {
          method: 'PATCH',
          body: payload
        }
      )

      entries.value = entries.value.map((entry) =>
        entry.id === weeklyAccountabilityId ? response.weeklyAccountability : entry
      )

      return response.weeklyAccountability
    } finally {
      pending.value = false
    }
  }

  async function deleteWeeklyAccountability(wigId: string, weeklyAccountabilityId: string) {
    pending.value = true

    try {
      await $fetch<{ success: true }>(
        `/api/wigs/${wigId}/weekly-accountability/${weeklyAccountabilityId}`,
        {
          method: 'DELETE'
        }
      )

      entries.value = entries.value.filter((entry) => entry.id !== weeklyAccountabilityId)
    } finally {
      pending.value = false
    }
  }

  return {
    entries,
    pending,
    fetchWeeklyAccountability,
    createWeeklyAccountability,
    updateWeeklyAccountability,
    deleteWeeklyAccountability
  }
}
