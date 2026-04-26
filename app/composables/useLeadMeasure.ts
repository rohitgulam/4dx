export type LeadMeasureRecord = {
  id: string
  wigId: string
  title: string
  description: string | null
  status: 'scheduled' | 'completed'
  scheduledDate: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

type LeadMeasurePayload = {
  title: string
  description?: string | null
  status: 'scheduled' | 'completed'
  scheduledDate: string
}

export function useLeadMeasure() {
  const leadMeasures = useState<LeadMeasureRecord[]>('lead-measure-records', () => [])
  const pending = useState('lead-measure-pending', () => false)

  async function fetchLeadMeasures(wigId: string) {
    pending.value = true

    try {
      const response = await $fetch<{ leadMeasures: LeadMeasureRecord[] }>(`/api/wigs/${wigId}/lead-measures`)
      leadMeasures.value = response.leadMeasures
      return response.leadMeasures
    } finally {
      pending.value = false
    }
  }

  async function createLeadMeasure(wigId: string, payload: LeadMeasurePayload) {
    pending.value = true

    try {
      const response = await $fetch<{ leadMeasure: LeadMeasureRecord }>(`/api/wigs/${wigId}/lead-measures`, {
        method: 'POST',
        body: payload
      })

      leadMeasures.value = [...leadMeasures.value, response.leadMeasure]
      return response.leadMeasure
    } finally {
      pending.value = false
    }
  }

  async function updateLeadMeasure(wigId: string, leadMeasureId: string, payload: Partial<LeadMeasurePayload>) {
    pending.value = true

    try {
      const response = await $fetch<{ leadMeasure: LeadMeasureRecord }>(
        `/api/wigs/${wigId}/lead-measures/${leadMeasureId}`,
        {
          method: 'PATCH',
          body: payload
        }
      )

      leadMeasures.value = leadMeasures.value.map((leadMeasure) =>
        leadMeasure.id === leadMeasureId ? response.leadMeasure : leadMeasure
      )

      return response.leadMeasure
    } finally {
      pending.value = false
    }
  }

  async function deleteLeadMeasure(wigId: string, leadMeasureId: string) {
    pending.value = true

    try {
      await $fetch<{ success: true }>(`/api/wigs/${wigId}/lead-measures/${leadMeasureId}`, {
        method: 'DELETE'
      })

      leadMeasures.value = leadMeasures.value.filter((leadMeasure) => leadMeasure.id !== leadMeasureId)
    } finally {
      pending.value = false
    }
  }

  return {
    leadMeasures,
    pending,
    fetchLeadMeasures,
    createLeadMeasure,
    updateLeadMeasure,
    deleteLeadMeasure
  }
}
