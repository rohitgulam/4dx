<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { fetchWig, updateWig, deleteWig, pending: wigPending } = useWig()
const {
  leadMeasures,
  fetchLeadMeasures,
  createLeadMeasure,
  updateLeadMeasure,
  pending: leadMeasurePending
} = useLeadMeasure()

type LeadMeasureStatus = 'scheduled' | 'completed'

const wigId = computed(() => String(route.params.id || ''))

const wigView = reactive({
  title: '',
  startValue: 0,
  currentValue: 0,
  targetValue: 0,
  unit: '',
  deadline: '',
  completedAt: null as string | null
})

const editWigForm = reactive({
  title: '',
  startValue: 0,
  currentValue: 0,
  targetValue: 0,
  unit: '',
  deadline: '',
  completed: false
})

const leadMeasureForm = reactive({
  title: '',
  description: '',
  status: 'scheduled' as LeadMeasureStatus,
  scheduledDate: ''
})

const wigModalOpen = ref(false)
const leadMeasureModalOpen = ref(false)
const editingLeadMeasureId = ref<string | null>(null)

const progress = computed(() => {
  return Math.max(
    0,
    Math.min(100, Math.round((wigView.currentValue / Math.max(wigView.targetValue, 1)) * 100))
  )
})

const completedLeadMeasures = computed(() =>
  leadMeasures.value.filter(leadMeasure => leadMeasure.status === 'completed').length
)

const scheduledLeadMeasures = computed(() =>
  leadMeasures.value.filter(leadMeasure => leadMeasure.status === 'scheduled').length
)

const remainingToGoal = computed(() => Math.max(wigView.targetValue - wigView.currentValue, 0))

const wigStatus = computed(() => {
  if (wigView.completedAt) {
    return {
      label: 'Completed',
      color: 'success' as const,
      description: `Finished on ${formatDate(wigView.completedAt)}`
    }
  }

  if (progress.value >= 80) {
    return {
      label: 'Close',
      color: 'primary' as const,
      description: `${remainingToGoal.value} ${wigView.unit} left to hit the goal`
    }
  }

  if (progress.value >= 40) {
    return {
      label: 'In Progress',
      color: 'warning' as const,
      description: `${wigView.currentValue} of ${wigView.targetValue} ${wigView.unit}`
    }
  }

  return {
    label: 'Starting',
    color: 'neutral' as const,
    description: 'Early progress still counts. Keep the cadence going.'
  }
})

const leadMeasureModalTitle = computed(() =>
  editingLeadMeasureId.value ? 'Edit Lead Measure' : 'New Lead Measure'
)

function syncWigView(record: Awaited<ReturnType<ReturnType<typeof useWig>['fetchWig']>>) {
  if (!record) {
    return
  }

  wigView.title = record.title
  wigView.startValue = record.startValue
  wigView.currentValue = record.currentValue
  wigView.targetValue = record.targetValue
  wigView.unit = record.unit
  wigView.deadline = record.deadline.slice(0, 10)
  wigView.completedAt = record.completedAt
}

async function loadPage() {
  const existingWig = await fetchWig(wigId.value)

  if (!existingWig) {
    throw createError({
      statusCode: 404,
      statusMessage: 'WIG not found'
    })
  }

  syncWigView(existingWig)
  await fetchLeadMeasures(wigId.value)
}

onMounted(loadPage)

function formatDate(date: string | null) {
  if (!date) {
    return 'Not completed'
  }

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function statusColor(status: LeadMeasureStatus) {
  return status === 'completed' ? 'success' : 'warning'
}

function resetLeadMeasureForm() {
  leadMeasureForm.title = ''
  leadMeasureForm.description = ''
  leadMeasureForm.status = 'scheduled'
  leadMeasureForm.scheduledDate = new Date().toISOString().slice(0, 10)
  editingLeadMeasureId.value = null
}

function openWigModal() {
  editWigForm.title = wigView.title
  editWigForm.startValue = wigView.startValue
  editWigForm.currentValue = wigView.currentValue
  editWigForm.targetValue = wigView.targetValue
  editWigForm.unit = wigView.unit
  editWigForm.deadline = wigView.deadline
  editWigForm.completed = Boolean(wigView.completedAt)
  wigModalOpen.value = true
}

function openCreateLeadMeasureModal() {
  resetLeadMeasureForm()
  leadMeasureModalOpen.value = true
}

function openEditLeadMeasureModal(leadMeasure: {
  id: string
  title: string
  description: string | null
  status: LeadMeasureStatus
  scheduledDate: string
}) {
  editingLeadMeasureId.value = leadMeasure.id
  leadMeasureForm.title = leadMeasure.title
  leadMeasureForm.description = leadMeasure.description ?? ''
  leadMeasureForm.status = leadMeasure.status
  leadMeasureForm.scheduledDate = leadMeasure.scheduledDate.slice(0, 10)
  leadMeasureModalOpen.value = true
}

async function saveWig() {
  try {
    const updatedWig = await updateWig(wigId.value, {
      title: editWigForm.title,
      startValue: editWigForm.startValue,
      currentValue: editWigForm.currentValue,
      targetValue: editWigForm.targetValue,
      unit: editWigForm.unit,
      deadline: editWigForm.deadline,
      completed: editWigForm.completed
    })

    syncWigView(updatedWig)
    wigModalOpen.value = false

    toast.add({
      title: 'WIG updated',
      description: 'Scoreboard refreshed.',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Unable to update WIG',
      description: 'Please try again.',
      color: 'error'
    })
  }
}

async function removeWig() {
  try {
    await deleteWig(wigId.value)
    wigModalOpen.value = false
    toast.add({
      title: 'WIG deleted',
      description: 'The goal has been removed.',
      color: 'success'
    })
    await router.push('/dashboard')
  } catch {
    toast.add({
      title: 'Unable to delete WIG',
      description: 'Please try again.',
      color: 'error'
    })
  }
}

async function saveLeadMeasure() {
  try {
    const isEditing = Boolean(editingLeadMeasureId.value)

    if (editingLeadMeasureId.value) {
      await updateLeadMeasure(wigId.value, editingLeadMeasureId.value, {
        title: leadMeasureForm.title,
        description: leadMeasureForm.description || null,
        status: leadMeasureForm.status,
        scheduledDate: leadMeasureForm.scheduledDate
      })
    } else {
      await createLeadMeasure(wigId.value, {
        title: leadMeasureForm.title,
        description: leadMeasureForm.description || null,
        status: leadMeasureForm.status,
        scheduledDate: leadMeasureForm.scheduledDate
      })
    }

    leadMeasureModalOpen.value = false
    resetLeadMeasureForm()

    toast.add({
      title: isEditing ? 'Lead measure updated' : 'Lead measure created',
      description: 'The WIG plan was updated.',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Unable to save lead measure',
      description: 'Please try again.',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="min-h-screen bg-default">
    <div class="border-b border-default bg-elevated/80 backdrop-blur">
      <UContainer class="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-start gap-3">
          <div class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <UIcon name="i-lucide-target" class="size-5" />
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-toned">WIG Scoreboard</p>
              <UBadge :color="wigStatus.color" variant="subtle">
                {{ wigStatus.label }}
              </UBadge>
            </div>
            <h1 class="text-3xl font-semibold text-highlighted">
              {{ wigView.title || 'Wildly important goal' }}
            </h1>
            <p class="text-sm text-muted">
              {{ wigStatus.description }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UButton to="/dashboard" color="neutral" variant="subtle" icon="i-lucide-arrow-left" label="Back to dashboard" />
          <UButton color="primary" icon="i-lucide-pencil-line" label="Edit WIG" @click="openWigModal" />
        </div>
      </UContainer>
    </div>

    <UContainer class="space-y-6 py-6">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UCard>
          <template #header>
            <p class="text-xs font-medium uppercase tracking-wide text-toned">Goal</p>
          </template>
          <p class="text-2xl font-semibold text-highlighted">
            {{ wigView.startValue }} -> {{ wigView.targetValue }}
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ wigView.unit }}
          </p>
        </UCard>

        <UCard>
          <template #header>
            <p class="text-xs font-medium uppercase tracking-wide text-toned">Current</p>
          </template>
          <p class="text-2xl font-semibold text-highlighted">
            {{ wigView.currentValue }}
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ wigView.unit }} completed so far
          </p>
        </UCard>

        <UCard>
          <template #header>
            <p class="text-xs font-medium uppercase tracking-wide text-toned">Remaining</p>
          </template>
          <p class="text-2xl font-semibold text-highlighted">
            {{ remainingToGoal }}
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ wigView.unit }} left to hit target
          </p>
        </UCard>

        <UCard>
          <template #header>
            <p class="text-xs font-medium uppercase tracking-wide text-toned">Deadline</p>
          </template>
          <p class="text-2xl font-semibold text-highlighted">
            {{ formatDate(wigView.deadline) }}
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ wigView.completedAt ? `Completed ${formatDate(wigView.completedAt)}` : 'Still active' }}
          </p>
        </UCard>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div class="space-y-6">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-4">
                <div class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">Scoreboard</p>
                  <p class="font-medium text-highlighted">Visible progress that keeps the WIG alive.</p>
                </div>
                <UBadge :color="wigStatus.color" variant="soft" size="lg">
                  {{ progress }}%
                </UBadge>
              </div>
            </template>

            <div class="space-y-5">
              <div class="rounded-3xl border border-default bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-wide text-toned">Momentum</p>
                    <p class="text-4xl font-semibold text-highlighted">
                      {{ wigView.currentValue }} / {{ wigView.targetValue }}
                    </p>
                    <p class="text-sm text-muted">
                      Every update makes the scoreboard more believable. Keep it moving.
                    </p>
                  </div>
                  <div class="rounded-2xl bg-default px-4 py-3 ring-1 ring-inset ring-default">
                    <p class="text-xs font-medium uppercase tracking-wide text-toned">Status</p>
                    <p class="mt-1 text-lg font-semibold text-highlighted">
                      {{ wigStatus.label }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between gap-4 text-sm">
                  <span class="font-medium text-highlighted">Progress toward target</span>
                  <span class="text-muted">{{ wigView.currentValue }} / {{ wigView.targetValue }} {{ wigView.unit }}</span>
                </div>
                <UProgress :model-value="progress" color="primary" />
              </div>

              <div class="grid gap-3 md:grid-cols-3">
                <div class="rounded-2xl border border-default bg-muted/20 p-4">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">Started</p>
                  <p class="mt-2 text-xl font-semibold text-highlighted">{{ wigView.startValue }}</p>
                </div>
                <div class="rounded-2xl border border-default bg-muted/20 p-4">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">Current</p>
                  <p class="mt-2 text-xl font-semibold text-highlighted">{{ wigView.currentValue }}</p>
                </div>
                <div class="rounded-2xl border border-default bg-muted/20 p-4">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">Target</p>
                  <p class="mt-2 text-xl font-semibold text-highlighted">{{ wigView.targetValue }}</p>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-4">
                <div class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">Lead Measures</p>
                  <p class="font-medium text-highlighted">Simple scheduled actions that move the goal.</p>
                </div>
                <UButton color="primary" icon="i-lucide-plus" label="Add Lead Measure" @click="openCreateLeadMeasureModal" />
              </div>
            </template>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl border border-default bg-muted/20 p-4">
                <p class="text-xs font-medium uppercase tracking-wide text-toned">Scheduled</p>
                <p class="mt-2 text-2xl font-semibold text-highlighted">{{ scheduledLeadMeasures }}</p>
              </div>
              <div class="rounded-2xl border border-default bg-muted/20 p-4">
                <p class="text-xs font-medium uppercase tracking-wide text-toned">Completed</p>
                <p class="mt-2 text-2xl font-semibold text-highlighted">{{ completedLeadMeasures }}</p>
              </div>
            </div>

            <div class="mt-4 space-y-3">
              <div
                v-if="leadMeasures.length === 0 && !leadMeasurePending"
                class="rounded-2xl border border-dashed border-default bg-muted/20 p-8 text-center"
              >
                <p class="font-medium text-highlighted">No lead measures yet</p>
                <p class="mt-2 text-sm text-muted">
                  Add the few actions that actually create progress on this WIG.
                </p>
              </div>

              <div
                v-for="leadMeasure in leadMeasures"
                :key="leadMeasure.id"
                class="rounded-2xl border border-default p-4"
              >
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-highlighted">{{ leadMeasure.title }}</p>
                      <UBadge :color="statusColor(leadMeasure.status)" variant="subtle">
                        {{ leadMeasure.status }}
                      </UBadge>
                    </div>

                    <p v-if="leadMeasure.description" class="text-sm text-muted">
                      {{ leadMeasure.description }}
                    </p>

                    <div class="flex flex-col gap-1 text-sm text-muted">
                      <p>Scheduled: {{ formatDate(leadMeasure.scheduledDate) }}</p>
                      <p>Completed: {{ formatDate(leadMeasure.completedAt) }}</p>
                    </div>
                  </div>

                  <UButton
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-pencil-line"
                    label="Edit"
                    @click="openEditLeadMeasureModal(leadMeasure)"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <div class="space-y-6">
          <UCard>
            <template #header>
              <p class="font-medium text-highlighted">Quick signal</p>
            </template>
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">Completion</span>
                <UBadge :color="wigStatus.color" variant="subtle">
                  {{ wigStatus.label }}
                </UBadge>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">Deadline</span>
                <span class="text-sm font-medium text-highlighted">{{ formatDate(wigView.deadline) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted">Lead measures</span>
                <span class="text-sm font-medium text-highlighted">{{ leadMeasures.length }}</span>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <p class="font-medium text-highlighted">Keep going</p>
            </template>
            <p class="text-sm text-muted">
              The scoreboard should feel alive. Update current value often, close lead measures, and let the visible progress pull you forward.
            </p>
          </UCard>
        </div>
      </div>
    </UContainer>

    <UModal v-model:open="wigModalOpen" title="Edit WIG">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Title">
            <UInput v-model="editWigForm.title" />
          </UFormField>

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Starting point">
              <UInput v-model.number="editWigForm.startValue" type="number" />
            </UFormField>
            <UFormField label="Current value">
              <UInput v-model.number="editWigForm.currentValue" type="number" />
            </UFormField>
            <UFormField label="Target value">
              <UInput v-model.number="editWigForm.targetValue" type="number" />
            </UFormField>
            <UFormField label="Unit">
              <UInput v-model="editWigForm.unit" />
            </UFormField>
          </div>

          <UFormField label="Deadline">
            <UInput v-model="editWigForm.deadline" type="date" />
          </UFormField>

          <div class="rounded-2xl border border-default p-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-medium text-highlighted">Mark as completed</p>
                <p class="text-sm text-muted">Use this when the WIG is done, even if you want to keep the record.</p>
              </div>
              <USwitch v-model="editWigForm.completed" />
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full items-center justify-between gap-3">
          <UButton color="error" variant="ghost" icon="i-lucide-trash-2" label="Delete WIG" :loading="wigPending" @click="removeWig" />
          <div class="flex gap-3">
            <UButton color="neutral" variant="ghost" label="Cancel" @click="wigModalOpen = false" />
            <UButton color="primary" label="Save" :loading="wigPending" @click="saveWig" />
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="leadMeasureModalOpen" :title="leadMeasureModalTitle">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Title">
            <UInput v-model="leadMeasureForm.title" placeholder="Book a school demo" />
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="leadMeasureForm.description" :rows="3" placeholder="Optional context" />
          </UFormField>

          <UFormField label="Scheduled date">
            <UInput v-model="leadMeasureForm.scheduledDate" type="date" />
          </UFormField>

          <UFormField label="Status">
            <div class="flex gap-2">
              <UButton
                :color="leadMeasureForm.status === 'scheduled' ? 'primary' : 'neutral'"
                :variant="leadMeasureForm.status === 'scheduled' ? 'soft' : 'outline'"
                label="Scheduled"
                @click="leadMeasureForm.status = 'scheduled'"
              />
              <UButton
                :color="leadMeasureForm.status === 'completed' ? 'success' : 'neutral'"
                :variant="leadMeasureForm.status === 'completed' ? 'soft' : 'outline'"
                label="Completed"
                @click="leadMeasureForm.status = 'completed'"
              />
            </div>
          </UFormField>

          <p v-if="leadMeasureForm.status === 'completed'" class="text-sm text-muted">
            Completed date is recorded automatically when saved.
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="leadMeasureModalOpen = false" />
          <UButton color="primary" label="Save" :loading="leadMeasurePending" @click="saveLeadMeasure" />
        </div>
      </template>
    </UModal>
  </div>
</template>
