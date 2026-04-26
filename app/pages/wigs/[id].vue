<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { CalendarDate, parseDate } from '@internationalized/date'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: false,
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
  deleteLeadMeasure,
  pending: leadMeasurePending,
} = useLeadMeasure()
const {
  entries: weeklyAccountabilityEntries,
  fetchWeeklyAccountability,
  createWeeklyAccountability,
  updateWeeklyAccountability,
  deleteWeeklyAccountability,
  pending: weeklyAccountabilityPending,
} = useWeeklyAccountability()

type LeadMeasureStatus = 'scheduled' | 'completed'
type LeadMeasureView = 'cards' | 'table'
type WeeklyAccountabilityStatus = 'winning' | 'at-risk' | 'behind'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const wigId = computed(() => String(route.params.id || ''))
const editWigDeadline = shallowRef<CalendarDate | null>(null)

const wigView = reactive({
  title: '',
  description: '',
  startValue: 0,
  currentValue: 0,
  targetValue: 0,
  unit: '',
  deadline: '',
  completedAt: null as string | null,
})

const editWigForm = reactive({
  title: '',
  description: '',
  startValue: 0,
  currentValue: 0,
  targetValue: 0,
  unit: '',
  deadline: '',
  completed: false,
})

const leadMeasureForm = reactive({
  title: '',
  description: '',
  status: 'scheduled' as LeadMeasureStatus,
  scheduledDate: '',
})

const weeklyAccountabilityForm = reactive({
  weekStartDate: '',
  status: 'at-risk' as WeeklyAccountabilityStatus,
  summary: '',
  nextCommitment: '',
})

const wigModalOpen = ref(false)
const leadMeasureModalOpen = ref(false)
const weeklyAccountabilityModalOpen = ref(false)
const editingLeadMeasureId = ref<string | null>(null)
const editingWeeklyAccountabilityId = ref<string | null>(null)
const leadMeasureView = ref<LeadMeasureView>('cards')
const leadMeasureSorting = ref([
  {
    id: 'scheduledDate',
    desc: false,
  },
])

const progress = computed(() => {
  return Math.max(
    0,
    Math.min(100, Math.round((wigView.currentValue / Math.max(wigView.targetValue, 1)) * 100))
  )
})

const completedLeadMeasures = computed(
  () => leadMeasures.value.filter((leadMeasure) => leadMeasure.status === 'completed').length
)

const scheduledLeadMeasures = computed(
  () => leadMeasures.value.filter((leadMeasure) => leadMeasure.status === 'scheduled').length
)

const remainingToGoal = computed(() => Math.max(wigView.targetValue - wigView.currentValue, 0))
const totalLeadMeasures = computed(() => leadMeasures.value.length)

const wigStatus = computed(() => {
  if (wigView.completedAt) {
    return {
      label: 'Completed',
      color: 'success' as const,
      description: `Finished on ${formatDate(wigView.completedAt)}`,
    }
  }

  if (progress.value >= 80) {
    return {
      label: 'Close',
      color: 'primary' as const,
      description: `${remainingToGoal.value} ${wigView.unit} left to hit the goal`,
    }
  }

  if (progress.value >= 40) {
    return {
      label: 'In Progress',
      color: 'warning' as const,
      description: `${wigView.currentValue} of ${wigView.targetValue} ${wigView.unit}`,
    }
  }

  return {
    label: 'Starting',
    color: 'neutral' as const,
    description: `${wigView.currentValue} of ${wigView.targetValue} ${wigView.unit}`,
  }
})

const scoreboardStats = computed(() => {
  const currentDelta =
    wigView.startValue > 0
      ? Math.round(((wigView.currentValue - wigView.startValue) / wigView.startValue) * 100)
      : 0

  const remainingVariation = -(100 - progress.value)
  const leadMeasureVariation =
    totalLeadMeasures.value > 0
      ? Math.round((completedLeadMeasures.value / totalLeadMeasures.value) * 100)
      : 0

  return [
    {
      icon: 'i-lucide-flag',
      title: 'Goal',
      value: `${wigView.startValue} -> ${wigView.targetValue}`,
      variation: progress.value,
    },
    {
      icon: 'i-lucide-trending-up',
      title: 'Current Progress',
      value: `${wigView.currentValue} ${wigView.unit}`,
      variation: currentDelta,
    },
    {
      icon: 'i-lucide-target',
      title: 'Remaining',
      value: `${remainingToGoal.value} ${wigView.unit}`,
      variation: remainingVariation,
    },
    {
      icon: 'i-lucide-list-checks',
      title: 'Lead Measures',
      value: `${completedLeadMeasures.value}/${totalLeadMeasures.value}`,
      variation: leadMeasureVariation,
    },
  ]
})

const leadMeasureModalTitle = computed(() =>
  editingLeadMeasureId.value ? 'Edit Lead Measure' : 'New Lead Measure'
)
const weeklyAccountabilityModalTitle = computed(() =>
  editingWeeklyAccountabilityId.value ? 'Edit Weekly Accountability' : 'New Weekly Accountability'
)

const leadMeasureColumns: TableColumn<(typeof leadMeasures.value)[number]>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) =>
      h('div', { class: 'space-y-1' }, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.title),
        h(
          'p',
          { class: 'text-sm text-muted' },
          row.original.description || 'No description'
        ),
      ]),
  },
  {
    accessorKey: 'status',
    header: ({ column }) =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Status',
        trailingIcon:
          column.getIsSorted() === 'asc'
            ? 'i-lucide-arrow-up'
            : column.getIsSorted() === 'desc'
              ? 'i-lucide-arrow-down'
              : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }),
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: statusColor(row.original.status),
          variant: 'subtle',
        },
        () => row.original.status
      ),
  },
  {
    accessorKey: 'scheduledDate',
    header: ({ column }) =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Scheduled',
        trailingIcon:
          column.getIsSorted() === 'asc'
            ? 'i-lucide-arrow-up'
            : column.getIsSorted() === 'desc'
              ? 'i-lucide-arrow-down'
              : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }),
    cell: ({ row }) => formatDate(row.original.scheduledDate),
  },
  {
    accessorKey: 'completedAt',
    header: ({ column }) =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Completed',
        trailingIcon:
          column.getIsSorted() === 'asc'
            ? 'i-lucide-arrow-up'
            : column.getIsSorted() === 'desc'
              ? 'i-lucide-arrow-down'
              : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }),
    cell: ({ row }) => formatDate(row.original.completedAt),
  },
  {
    id: 'actions',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center justify-end gap-2' }, [
        row.original.status !== 'completed'
          ? h(UButton, {
              color: 'success',
              variant: 'soft',
              icon: 'i-lucide-check',
              size: 'sm',
              'aria-label': 'Mark complete',
              onClick: () => markLeadMeasureCompleted(row.original.id),
            })
          : null,
        h(UButton, {
          color: 'neutral',
          variant: 'subtle',
          icon: 'i-lucide-pencil-line',
          size: 'sm',
          'aria-label': 'Edit lead measure',
          onClick: () => openEditLeadMeasureModal(row.original),
        }),
      ].filter(Boolean)),
    meta: {
      class: {
        th: 'w-24',
        td: 'text-right',
      },
    },
  },
]

function syncWigView(record: Awaited<ReturnType<ReturnType<typeof useWig>['fetchWig']>>) {
  if (!record) {
    return
  }

  wigView.title = record.title
  wigView.description = record.description || ''
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
      statusMessage: 'WIG not found',
    })
  }

  syncWigView(existingWig)
  await fetchLeadMeasures(wigId.value)
  await fetchWeeklyAccountability(wigId.value)
}

onMounted(loadPage)

function formatDate(date: string | null) {
  if (!date) {
    return 'Not completed'
  }

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusColor(status: LeadMeasureStatus) {
  return status === 'completed' ? 'success' : 'warning'
}

function weeklyStatusColor(status: WeeklyAccountabilityStatus) {
  if (status === 'winning') {
    return 'success'
  }

  if (status === 'at-risk') {
    return 'warning'
  }

  return 'error'
}

function resetLeadMeasureForm() {
  leadMeasureForm.title = ''
  leadMeasureForm.description = ''
  leadMeasureForm.status = 'scheduled'
  leadMeasureForm.scheduledDate = new Date().toISOString().slice(0, 10)
  editingLeadMeasureId.value = null
}

function resetWeeklyAccountabilityForm() {
  weeklyAccountabilityForm.weekStartDate = new Date().toISOString().slice(0, 10)
  weeklyAccountabilityForm.status = 'at-risk'
  weeklyAccountabilityForm.summary = ''
  weeklyAccountabilityForm.nextCommitment = ''
  editingWeeklyAccountabilityId.value = null
}

function openWigModal() {
  editWigForm.title = wigView.title
  editWigForm.description = wigView.description
  editWigForm.startValue = wigView.startValue
  editWigForm.currentValue = wigView.currentValue
  editWigForm.targetValue = wigView.targetValue
  editWigForm.unit = wigView.unit
  editWigForm.deadline = wigView.deadline
  editWigDeadline.value = wigView.deadline ? parseDate(wigView.deadline) : null
  editWigForm.completed = Boolean(wigView.completedAt)
  wigModalOpen.value = true
}

function openCreateLeadMeasureModal() {
  resetLeadMeasureForm()
  leadMeasureModalOpen.value = true
}

function openCreateWeeklyAccountabilityModal() {
  resetWeeklyAccountabilityForm()
  weeklyAccountabilityModalOpen.value = true
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

function openEditWeeklyAccountabilityModal(entry: {
  id: string
  weekStartDate: string
  status: WeeklyAccountabilityStatus
  summary: string
  nextCommitment: string | null
}) {
  editingWeeklyAccountabilityId.value = entry.id
  weeklyAccountabilityForm.weekStartDate = entry.weekStartDate.slice(0, 10)
  weeklyAccountabilityForm.status = entry.status
  weeklyAccountabilityForm.summary = entry.summary
  weeklyAccountabilityForm.nextCommitment = entry.nextCommitment ?? ''
  weeklyAccountabilityModalOpen.value = true
}

async function markLeadMeasureCompleted(leadMeasureId: string) {
  try {
    await updateLeadMeasure(wigId.value, leadMeasureId, {
      status: 'completed'
    })

    toast.add({
      title: 'Lead measure completed',
      description: 'Progress recorded on the scoreboard.',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Unable to complete lead measure',
      description: 'Please try again.',
      color: 'error'
    })
  }
}

async function saveWig() {
  try {
    const updatedWig = await updateWig(wigId.value, {
      title: editWigForm.title,
      description: editWigForm.description || null,
      startValue: editWigForm.startValue,
      currentValue: editWigForm.currentValue,
      targetValue: editWigForm.targetValue,
      unit: editWigForm.unit,
      deadline: editWigDeadline.value ? editWigDeadline.value.toString() : '',
      completed: editWigForm.completed,
    })

    syncWigView(updatedWig)
    wigModalOpen.value = false

    toast.add({
      title: 'WIG updated',
      description: 'Scoreboard refreshed.',
      color: 'success',
    })
  } catch {
    toast.add({
      title: 'Unable to update WIG',
      description: 'Please try again.',
      color: 'error',
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
      color: 'success',
    })
    await router.push('/dashboard')
  } catch {
    toast.add({
      title: 'Unable to delete WIG',
      description: 'Please try again.',
      color: 'error',
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
        scheduledDate: leadMeasureForm.scheduledDate,
      })
    } else {
      await createLeadMeasure(wigId.value, {
        title: leadMeasureForm.title,
        description: leadMeasureForm.description || null,
        status: leadMeasureForm.status,
        scheduledDate: leadMeasureForm.scheduledDate,
      })
    }

    leadMeasureModalOpen.value = false
    resetLeadMeasureForm()

    toast.add({
      title: isEditing ? 'Lead measure updated' : 'Lead measure created',
      description: 'The WIG plan was updated.',
      color: 'success',
    })
  } catch {
    toast.add({
      title: 'Unable to save lead measure',
      description: 'Please try again.',
      color: 'error',
    })
  }
}

async function removeLeadMeasure() {
  if (!editingLeadMeasureId.value) {
    return
  }

  try {
    await deleteLeadMeasure(wigId.value, editingLeadMeasureId.value)
    leadMeasureModalOpen.value = false
    resetLeadMeasureForm()

    toast.add({
      title: 'Lead measure deleted',
      description: 'The lead measure has been removed.',
      color: 'success',
    })
  } catch {
    toast.add({
      title: 'Unable to delete lead measure',
      description: 'Please try again.',
      color: 'error',
    })
  }
}

async function saveWeeklyAccountability() {
  try {
    const isEditing = Boolean(editingWeeklyAccountabilityId.value)

    if (editingWeeklyAccountabilityId.value) {
      await updateWeeklyAccountability(wigId.value, editingWeeklyAccountabilityId.value, {
        weekStartDate: weeklyAccountabilityForm.weekStartDate,
        status: weeklyAccountabilityForm.status,
        summary: weeklyAccountabilityForm.summary,
        nextCommitment: weeklyAccountabilityForm.nextCommitment || null,
      })
    } else {
      await createWeeklyAccountability(wigId.value, {
        weekStartDate: weeklyAccountabilityForm.weekStartDate,
        status: weeklyAccountabilityForm.status,
        summary: weeklyAccountabilityForm.summary,
        nextCommitment: weeklyAccountabilityForm.nextCommitment || null,
      })
    }

    weeklyAccountabilityModalOpen.value = false
    resetWeeklyAccountabilityForm()

    toast.add({
      title: isEditing ? 'Weekly accountability updated' : 'Weekly accountability created',
      description: 'Weekly review saved.',
      color: 'success',
    })
  } catch {
    toast.add({
      title: 'Unable to save weekly accountability',
      description: 'Please try again.',
      color: 'error',
    })
  }
}

async function removeWeeklyAccountability() {
  if (!editingWeeklyAccountabilityId.value) {
    return
  }

  try {
    await deleteWeeklyAccountability(wigId.value, editingWeeklyAccountabilityId.value)
    weeklyAccountabilityModalOpen.value = false
    resetWeeklyAccountabilityForm()

    toast.add({
      title: 'Weekly accountability deleted',
      description: 'The weekly review has been removed.',
      color: 'success',
    })
  } catch {
    toast.add({
      title: 'Unable to delete weekly accountability',
      description: 'Please try again.',
      color: 'error',
    })
  }
}
</script>

<template>
  <div class="min-h-screen bg-default">
    <div class="border-b border-default bg-elevated/80 backdrop-blur">
      <UContainer class="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-start gap-3">
          <div
            class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
          >
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
            <p v-if="wigView.description" class="text-sm text-muted">
              {{ wigView.description }}
            </p>
            <p class="text-sm text-muted">
              {{ wigStatus.description }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            to="/dashboard"
            color="neutral"
            variant="subtle"
            icon="i-lucide-arrow-left"
            label="Back to dashboard"
          />
          <UButton
            color="primary"
            icon="i-lucide-pencil-line"
            label="Edit WIG"
            @click="openWigModal"
          />
        </div>
      </UContainer>
    </div>

    <UContainer class="space-y-6 py-6">
      <UPageGrid class="gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-px">
        <UPageCard
          v-for="(stat, index) in scoreboardStats"
          :key="index"
          :icon="stat.icon"
          :title="stat.title"
          variant="subtle"
          :ui="{
            container: 'gap-y-1.5',
            wrapper: 'items-start',
            leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
            title: 'font-normal text-muted text-xs uppercase',
          }"
          class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg"
        >
          <div class="flex items-center gap-2">
            <span class="text-2xl font-semibold text-highlighted">
              {{ stat.value }}
            </span>

            <UBadge
              :color="stat.variation > 0 ? 'success' : 'error'"
              variant="subtle"
              class="text-xs"
            >
              {{ stat.variation > 0 ? '+' : '' }}{{ stat.variation }}%
            </UBadge>
          </div>
        </UPageCard>
      </UPageGrid>

      <div class="grid gap-6">
        <div class="space-y-6">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-4">
                <div class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">Scoreboard</p>
                  <p class="font-medium text-highlighted">Progress</p>
                </div>
                <UBadge :color="wigStatus.color" variant="soft" size="lg"> {{ progress }}% </UBadge>
              </div>
            </template>

            <div class="space-y-5">
              <div
                class="rounded-3xl border border-default bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6"
              >
                <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div class="space-y-2">
                    <p class="text-xs font-medium uppercase tracking-wide text-toned">Momentum</p>
                    <p class="text-4xl font-semibold text-highlighted">
                      {{ wigView.currentValue }} / {{ wigView.targetValue }}
                    </p>
                    <p class="text-sm text-muted">{{ wigView.unit }}</p>
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
                  <span class="text-muted"
                    >{{ wigView.currentValue }} / {{ wigView.targetValue }} {{ wigView.unit }}</span
                  >
                </div>
                <UProgress :model-value="progress" color="primary" />
              </div>

              <div class="grid gap-3 md:grid-cols-3">
                <div class="rounded-2xl border border-default bg-muted/20 p-4">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">Started</p>
                  <p class="mt-2 text-xl font-semibold text-highlighted">
                    {{ wigView.startValue }}
                  </p>
                </div>
                <div class="rounded-2xl border border-default bg-muted/20 p-4">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">Current</p>
                  <p class="mt-2 text-xl font-semibold text-highlighted">
                    {{ wigView.currentValue }}
                  </p>
                </div>
                <div class="rounded-2xl border border-default bg-muted/20 p-4">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">Target</p>
                  <p class="mt-2 text-xl font-semibold text-highlighted">
                    {{ wigView.targetValue }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-4">
                <div class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">
                    Lead Measures
                  </p>
                  <p class="font-medium text-highlighted">Actions</p>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1 rounded-lg border border-default p-1">
                    <UButton
                      :color="leadMeasureView === 'cards' ? 'primary' : 'neutral'"
                      :variant="leadMeasureView === 'cards' ? 'soft' : 'ghost'"
                      icon="i-lucide-layout-grid"
                      size="sm"
                      @click="leadMeasureView = 'cards'"
                    />
                    <UButton
                      :color="leadMeasureView === 'table' ? 'primary' : 'neutral'"
                      :variant="leadMeasureView === 'table' ? 'soft' : 'ghost'"
                      icon="i-lucide-table-properties"
                      size="sm"
                      @click="leadMeasureView = 'table'"
                    />
                  </div>
                  <UButton
                    color="primary"
                    icon="i-lucide-plus"
                    label="Add Lead Measure"
                    @click="openCreateLeadMeasureModal"
                  />
                </div>
              </div>
            </template>

            <div v-if="leadMeasureView === 'cards'" class="mt-4 space-y-3">
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

                  <div class="flex items-center gap-2">
                    <UButton
                      v-if="leadMeasure.status !== 'completed'"
                      color="success"
                      variant="soft"
                      icon="i-lucide-check"
                      label="Mark complete"
                      :loading="leadMeasurePending"
                      @click="markLeadMeasureCompleted(leadMeasure.id)"
                    />
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
            </div>

            <div
              v-else-if="leadMeasures.length === 0 && !leadMeasurePending"
              class="mt-4 rounded-2xl border border-dashed border-default bg-muted/20 p-8 text-center"
            >
              <p class="font-medium text-highlighted">No lead measures yet</p>
              <p class="mt-2 text-sm text-muted">
                Add the few actions that actually create progress on this WIG.
              </p>
            </div>

            <div v-else class="mt-4 overflow-hidden rounded-2xl border border-default">
              <UTable
                v-model:sorting="leadMeasureSorting"
                :data="leadMeasures"
                :columns="leadMeasureColumns"
                class="flex-1"
              />
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-4">
                <div class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">
                    Cadence of Weekly Accountability
                  </p>
                  <p class="font-medium text-highlighted">Weekly review</p>
                </div>
                <UButton
                  color="primary"
                  icon="i-lucide-plus"
                  label="Add Weekly Review"
                  @click="openCreateWeeklyAccountabilityModal"
                />
              </div>
            </template>

            <div
              v-if="weeklyAccountabilityEntries.length === 0 && !weeklyAccountabilityPending"
              class="rounded-2xl border border-dashed border-default bg-muted/20 p-8 text-center"
            >
              <p class="font-medium text-highlighted">No weekly accountability yet</p>
              <p class="mt-2 text-sm text-muted">
                Add at least one end-of-week review for this WIG.
              </p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="entry in weeklyAccountabilityEntries"
                :key="entry.id"
                class="rounded-2xl border border-default p-4"
              >
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-highlighted">
                        Week of {{ formatDate(entry.weekStartDate) }}
                      </p>
                      <UBadge :color="weeklyStatusColor(entry.status)" variant="subtle">
                        {{ entry.status }}
                      </UBadge>
                    </div>
                    <p class="text-sm text-muted">
                      {{ entry.summary }}
                    </p>
                    <p v-if="entry.nextCommitment" class="text-sm text-toned">
                      Next commitment: {{ entry.nextCommitment }}
                    </p>
                  </div>

                  <UButton
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-pencil-line"
                    label="Edit"
                    @click="openEditWeeklyAccountabilityModal(entry)"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </UContainer>

    <UModal v-model:open="wigModalOpen" title="Edit WIG">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Title">
            <UInput v-model="editWigForm.title" class="w-full" />
          </UFormField>

          <UFormField label="Description">
            <UTextarea v-model="editWigForm.description" :rows="3" class="w-full" />
          </UFormField>

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Starting point">
              <UInput v-model.number="editWigForm.startValue" class="w-full" type="number" />
            </UFormField>
            <UFormField label="Current value">
              <UInput v-model.number="editWigForm.currentValue" class="w-full" type="number" />
            </UFormField>
            <UFormField label="Target value">
              <UInput v-model.number="editWigForm.targetValue" class="w-full" type="number" />
            </UFormField>
            <UFormField label="Unit">
              <UInput v-model="editWigForm.unit" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Deadline">
            <UInputDate v-model="editWigDeadline" class="w-full" />
          </UFormField>

          <div class="rounded-2xl border border-default p-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-medium text-highlighted">Mark as completed</p>
                <p class="text-sm text-muted">
                  Use this when the WIG is done, even if you want to keep the record.
                </p>
              </div>
              <USwitch v-model="editWigForm.completed" />
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full items-center justify-between gap-3">
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            label="Delete WIG"
            :loading="wigPending"
            @click="removeWig"
          />
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
            <UInput
              v-model="leadMeasureForm.title"
              class="w-full"
              placeholder="Book a school demo"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="leadMeasureForm.description"
              :rows="3"
              placeholder="Optional context"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Scheduled date">
            <UInput v-model="leadMeasureForm.scheduledDate" class="w-full" type="date" />
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
        <div class="flex w-full items-center justify-between gap-3">
          <UButton
            v-if="editingLeadMeasureId"
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            label="Delete"
            :loading="leadMeasurePending"
            @click="removeLeadMeasure"
          />
          <div class="flex gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              @click="leadMeasureModalOpen = false"
            />
            <UButton
              color="primary"
              label="Save"
              :loading="leadMeasurePending"
              @click="saveLeadMeasure"
            />
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="weeklyAccountabilityModalOpen" :title="weeklyAccountabilityModalTitle">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Week start date">
            <UInput v-model="weeklyAccountabilityForm.weekStartDate" class="w-full" type="date" />
          </UFormField>

          <UFormField label="Status">
            <div class="flex gap-2">
              <UButton
                :color="weeklyAccountabilityForm.status === 'winning' ? 'success' : 'neutral'"
                :variant="weeklyAccountabilityForm.status === 'winning' ? 'soft' : 'outline'"
                label="Winning"
                @click="weeklyAccountabilityForm.status = 'winning'"
              />
              <UButton
                :color="weeklyAccountabilityForm.status === 'at-risk' ? 'warning' : 'neutral'"
                :variant="weeklyAccountabilityForm.status === 'at-risk' ? 'soft' : 'outline'"
                label="At Risk"
                @click="weeklyAccountabilityForm.status = 'at-risk'"
              />
              <UButton
                :color="weeklyAccountabilityForm.status === 'behind' ? 'error' : 'neutral'"
                :variant="weeklyAccountabilityForm.status === 'behind' ? 'soft' : 'outline'"
                label="Behind"
                @click="weeklyAccountabilityForm.status = 'behind'"
              />
            </div>
          </UFormField>

          <UFormField label="Summary">
            <UTextarea
              v-model="weeklyAccountabilityForm.summary"
              :rows="4"
              class="w-full"
              placeholder="What happened this week?"
            />
          </UFormField>

          <UFormField label="Next commitment">
            <UTextarea
              v-model="weeklyAccountabilityForm.nextCommitment"
              :rows="3"
              class="w-full"
              placeholder="What will you commit to next week?"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full items-center justify-between gap-3">
          <UButton
            v-if="editingWeeklyAccountabilityId"
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            label="Delete"
            :loading="weeklyAccountabilityPending"
            @click="removeWeeklyAccountability"
          />
          <div class="flex gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              @click="weeklyAccountabilityModalOpen = false"
            />
            <UButton
              color="primary"
              label="Save"
              :loading="weeklyAccountabilityPending"
              @click="saveWeeklyAccountability"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
