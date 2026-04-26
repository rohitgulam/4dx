<script setup lang="ts">
definePageMeta({
  layout: false,
})

type SectionId = 'dashboard' | 'wig-setup' | 'daily' | 'weekly'
type MeasureStatus = 'winning' | 'at-risk' | 'behind'

type LeadMeasure = {
  id: string
  name: string
  target: number
  unit: string
  baseWeeklyCount: number
  todayCount: number
  history: Array<{ day: string; value: number | null }>
}

type WeeklyCommitment = {
  id: string
  text: string
  completed: boolean
}

const { user, clear } = useUserSession()

const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: 'i-lucide-layout-dashboard' },
  { id: 'wig-setup', label: 'WIG Setup', icon: 'i-lucide-flag' },
  { id: 'daily', label: 'Daily Log', icon: 'i-lucide-calendar-days' },
  { id: 'weekly', label: 'Weekly Review', icon: 'i-lucide-target' },
] satisfies Array<{ id: SectionId; label: string; icon: string }>

const activeSection = ref<SectionId>('dashboard')

const wig = reactive({
  from: 53,
  to: 150,
  unit: 'paying users',
  deadline: '2025-09-30',
})

const leadMeasures = reactive<LeadMeasure[]>([
  {
    id: 'school-demos',
    name: 'School demos',
    target: 5,
    unit: 'demos',
    baseWeeklyCount: 3,
    todayCount: 0,
    history: [
      { day: 'Mon', value: 1 },
      { day: 'Tue', value: 1 },
      { day: 'Wed', value: 1 },
      { day: 'Thu', value: 0 },
      { day: 'Fri', value: null },
    ],
  },
  {
    id: 'follow-up-calls',
    name: 'Follow-up calls',
    target: 6,
    unit: 'calls',
    baseWeeklyCount: 7,
    todayCount: 0,
    history: [
      { day: 'Mon', value: 2 },
      { day: 'Tue', value: 3 },
      { day: 'Wed', value: 2 },
      { day: 'Thu', value: 0 },
      { day: 'Fri', value: null },
    ],
  },
  {
    id: 'linkedin-posts',
    name: 'LinkedIn posts',
    target: 3,
    unit: 'posts',
    baseWeeklyCount: 1,
    todayCount: 0,
    history: [
      { day: 'Mon', value: 0 },
      { day: 'Tue', value: 1 },
      { day: 'Wed', value: 0 },
      { day: 'Thu', value: 0 },
      { day: 'Fri', value: null },
    ],
  },
])

const previousWeekCommitments = reactive<WeeklyCommitment[]>([
  { id: '1', text: 'Run 3 school demos by Thursday', completed: true },
  { id: '2', text: 'Write and schedule 2 LinkedIn posts', completed: false },
  { id: '3', text: 'Send 5 follow-up emails after demos', completed: true },
])

const nextWeekCommitments = ref(['Run 5 school demos by Friday', 'Publish 3 LinkedIn posts', ''])

const weekLabel = computed(() =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(new Date())
)

const longDate = computed(() =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
)

const wigTitle = computed(() => `${wig.from} -> ${wig.to} ${wig.unit}`)

const wigProgress = computed(() => {
  const distance = wig.to - wig.from
  if (distance <= 0) {
    return 100
  }

  return Math.max(0, Math.min(100, Math.round((wig.from / wig.to) * 100)))
})

const totalWeeklyTarget = computed(() =>
  leadMeasures.reduce((sum, measure) => sum + measure.target, 0)
)

const totalWeeklyCount = computed(() =>
  leadMeasures.reduce((sum, measure) => sum + weeklyCount(measure), 0)
)

const completedCommitments = computed(
  () => previousWeekCommitments.filter((item) => item.completed).length
)

const overallStatus = computed(() => {
  const score =
    leadMeasures.reduce((sum, measure) => {
      return sum + weeklyCount(measure) / Math.max(measure.target, 1)
    }, 0) / leadMeasures.length

  if (score >= 1) {
    return {
      label: 'Winning',
      color: 'success' as const,
      icon: 'i-lucide-badge-check',
    }
  }

  if (score >= 0.6) {
    return {
      label: 'At Risk',
      color: 'warning' as const,
      icon: 'i-lucide-triangle-alert',
    }
  }

  return {
    label: 'Behind',
    color: 'error' as const,
    icon: 'i-lucide-octagon-alert',
  }
})

function weeklyCount(measure: LeadMeasure) {
  return measure.baseWeeklyCount + measure.todayCount
}

function measurePercent(measure: LeadMeasure) {
  return Math.round((weeklyCount(measure) / Math.max(measure.target, 1)) * 100)
}

function measureStatus(measure: LeadMeasure): {
  state: MeasureStatus
  label: string
  color: 'success' | 'warning' | 'error'
  icon: string
} {
  const ratio = weeklyCount(measure) / Math.max(measure.target, 1)

  if (ratio >= 1) {
    return {
      state: 'winning',
      label: 'Winning',
      color: 'success',
      icon: 'i-lucide-trending-up',
    }
  }

  if (ratio >= 0.6) {
    return {
      state: 'at-risk',
      label: 'At Risk',
      color: 'warning',
      icon: 'i-lucide-timer',
    }
  }

  return {
    state: 'behind',
    label: 'Behind',
    color: 'error',
    icon: 'i-lucide-trending-down',
  }
}

function incrementToday(measure: LeadMeasure) {
  measure.todayCount += 1
}

function decrementToday(measure: LeadMeasure) {
  measure.todayCount = Math.max(0, measure.todayCount - 1)
}

function addLeadMeasure() {
  leadMeasures.push({
    id: `measure-${leadMeasures.length + 1}`,
    name: `Lead measure ${leadMeasures.length + 1}`,
    target: 1,
    unit: 'actions',
    baseWeeklyCount: 0,
    todayCount: 0,
    history: [
      { day: 'Mon', value: 0 },
      { day: 'Tue', value: 0 },
      { day: 'Wed', value: 0 },
      { day: 'Thu', value: 0 },
      { day: 'Fri', value: null },
    ],
  })
}

function addCommitment() {
  nextWeekCommitments.value.push('')
}

async function logout() {
  await clear()
  await navigateTo('/login')
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
              <p class="text-sm font-medium text-toned">4DX Command Center</p>
              <UBadge color="primary" variant="subtle" label="UI prototype" />
            </div>
            <h1 class="text-2xl font-semibold text-highlighted">Personal execution system</h1>
            <p class="text-sm text-muted">
              Track a single wildly important goal, the lead measures that move it, and the
              commitments that keep the week honest.
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="rounded-xl border border-default bg-default px-4 py-3">
            <p class="text-xs font-medium uppercase tracking-wide text-toned">Signed in</p>
            <p class="text-sm font-medium text-highlighted">
              {{ user?.email }}
            </p>
          </div>
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-log-out"
            label="Logout"
            @click="logout"
          />
        </div>
      </UContainer>
    </div>

    <UContainer class="grid gap-6 py-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside class="space-y-4">
        <UCard>
          <template #header>
            <div class="space-y-1">
              <p class="text-xs font-medium uppercase tracking-wide text-toned">Week of</p>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-calendar-range" class="size-4 text-primary" />
                <p class="font-medium text-highlighted">
                  {{ weekLabel }}
                </p>
              </div>
            </div>
          </template>

          <div class="space-y-2">
            <UButton
              v-for="section in sections"
              :key="section.id"
              :color="activeSection === section.id ? 'primary' : 'neutral'"
              :variant="activeSection === section.id ? 'soft' : 'ghost'"
              :icon="section.icon"
              :label="section.label"
              class="w-full justify-start"
              @click="activeSection = section.id"
            />
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon :name="overallStatus.icon" class="size-4 text-primary" />
              <p class="font-medium text-highlighted">Overall signal</p>
            </div>
          </template>

          <div class="space-y-3">
            <UBadge :color="overallStatus.color" variant="subtle" class="w-fit">
              {{ overallStatus.label }}
            </UBadge>
            <p class="text-sm text-muted">
              {{ totalWeeklyCount }} of {{ totalWeeklyTarget }} planned lead-measure actions are
              already logged this week.
            </p>
          </div>
        </UCard>
      </aside>

      <main class="space-y-6">
        <template v-if="activeSection === 'dashboard'">
          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <UCard>
              <template #header>
                <div class="flex items-start justify-between gap-4">
                  <div class="space-y-1">
                    <p class="text-xs font-medium uppercase tracking-wide text-toned">
                      Wildly Important Goal
                    </p>
                    <h2 class="text-2xl font-semibold text-highlighted">
                      {{ wigTitle }}
                    </h2>
                    <p class="text-sm text-muted">
                      by
                      {{
                        new Date(wig.deadline).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      }}
                    </p>
                  </div>

                  <UButton
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-pencil-line"
                    label="Edit WIG"
                    @click="activeSection = 'wig-setup'"
                  />
                </div>
              </template>

              <div class="space-y-4">
                <div class="rounded-2xl border border-default bg-muted/30 p-4">
                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <p class="text-xs font-medium uppercase tracking-wide text-toned">
                        Scoreboard
                      </p>
                      <div class="mt-2 flex items-center gap-2">
                        <UIcon :name="overallStatus.icon" class="size-5 text-primary" />
                        <p class="text-3xl font-semibold text-highlighted">
                          {{ overallStatus.label }}
                        </p>
                      </div>
                    </div>
                    <UBadge :color="overallStatus.color" variant="soft" size="lg">
                      {{ wig.from }} / {{ wig.to }}
                    </UBadge>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="flex items-center justify-between gap-4 text-sm">
                    <span class="font-medium text-highlighted">WIG progress</span>
                    <span class="text-muted">{{ wig.from }} / {{ wig.to }} {{ wig.unit }}</span>
                  </div>
                  <UProgress :model-value="wigProgress" color="primary" />
                </div>

                <div class="grid gap-3">
                  <div
                    v-for="measure in leadMeasures"
                    :key="measure.id"
                    class="rounded-2xl border border-default p-4"
                  >
                    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div class="space-y-1">
                        <p class="font-medium text-highlighted">
                          {{ measure.name }}
                        </p>
                        <p class="text-sm text-muted">
                          {{ weeklyCount(measure) }} of {{ measure.target }}
                          {{ measure.unit }} logged this week
                        </p>
                      </div>

                      <div class="flex items-center gap-3">
                        <div class="min-w-28 text-right">
                          <p class="text-2xl font-semibold text-highlighted">
                            {{ weeklyCount(measure) }}
                            <span class="text-sm font-medium text-muted"
                              >/ {{ measure.target }}</span
                            >
                          </p>
                        </div>
                        <UBadge :color="measureStatus(measure).color" variant="subtle">
                          {{ measureStatus(measure).label }}
                        </UBadge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <div class="space-y-6">
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between gap-4">
                    <div class="space-y-1">
                      <p class="text-xs font-medium uppercase tracking-wide text-toned">
                        Lead Measures
                      </p>
                      <p class="font-medium text-highlighted">This week</p>
                    </div>
                    <UBadge color="neutral" variant="subtle">
                      {{ leadMeasures.length }} active
                    </UBadge>
                  </div>
                </template>

                <div class="space-y-3">
                  <div
                    v-for="measure in leadMeasures"
                    :key="measure.id"
                    class="flex items-center justify-between gap-4 rounded-2xl border border-default p-4"
                  >
                    <div class="space-y-1">
                      <p class="font-medium text-highlighted">
                        {{ measure.name }}
                      </p>
                      <div class="flex items-center gap-2">
                        <UBadge :color="measureStatus(measure).color" variant="subtle">
                          {{ weeklyCount(measure) }} / {{ measure.target }}
                        </UBadge>
                        <span class="text-sm text-muted">{{ measure.unit }}</span>
                      </div>
                    </div>

                    <UButton
                      icon="i-lucide-plus"
                      color="primary"
                      variant="soft"
                      @click="incrementToday(measure)"
                    />
                  </div>
                </div>
              </UCard>

              <UCard>
                <template #header>
                  <div class="space-y-1">
                    <p class="text-xs font-medium uppercase tracking-wide text-toned">
                      Today's Log
                    </p>
                    <p class="font-medium text-highlighted">
                      {{ longDate }}
                    </p>
                  </div>
                </template>

                <div class="space-y-3">
                  <div
                    v-for="measure in leadMeasures"
                    :key="`${measure.id}-today`"
                    class="flex items-center justify-between gap-4 rounded-2xl border border-default p-4"
                  >
                    <div>
                      <p class="font-medium text-highlighted">
                        {{ measure.name }}
                      </p>
                      <p class="text-sm text-muted">{{ measure.todayCount }} completed today</p>
                    </div>

                    <div class="flex items-center gap-3">
                      <UButton
                        icon="i-lucide-plus"
                        color="primary"
                        variant="soft"
                        @click="incrementToday(measure)"
                      />
                      <p class="min-w-8 text-center text-2xl font-semibold text-highlighted">
                        {{ measure.todayCount }}
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
                        This Week I Will...
                      </p>
                      <p class="font-medium text-highlighted">Commitments preview</p>
                    </div>
                    <UButton
                      color="neutral"
                      variant="subtle"
                      trailing-icon="i-lucide-arrow-right"
                      label="Review week"
                      @click="activeSection = 'weekly'"
                    />
                  </div>
                </template>

                <div class="space-y-3">
                  <div
                    v-for="(commitment, index) in nextWeekCommitments.filter(Boolean)"
                    :key="`${commitment}-${index}`"
                    class="flex items-start gap-3 rounded-2xl border border-default p-4"
                  >
                    <div
                      class="mt-0.5 flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary"
                    >
                      <UIcon name="i-lucide-check" class="size-4" />
                    </div>
                    <p class="text-sm text-highlighted">
                      {{ commitment }}
                    </p>
                  </div>
                </div>
              </UCard>
            </div>
          </div>
        </template>

        <template v-else-if="activeSection === 'wig-setup'">
          <div class="space-y-6">
            <UCard>
              <template #header>
                <div class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">
                    Define your WIG
                  </p>
                  <p class="font-medium text-highlighted">
                    Set the lag measure, target, and deadline
                  </p>
                </div>
              </template>

              <div class="grid gap-4 md:grid-cols-2">
                <UFormField label="Starting point (From)">
                  <UInput v-model.number="wig.from" type="number" />
                </UFormField>

                <UFormField label="Target (To)">
                  <UInput v-model.number="wig.to" type="number" />
                </UFormField>

                <UFormField label="Unit / Description" class="md:col-span-2">
                  <UInput v-model="wig.unit" />
                </UFormField>

                <UFormField label="Deadline" class="md:col-span-2">
                  <UInput v-model="wig.deadline" type="date" />
                </UFormField>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-center justify-between gap-4">
                  <div class="space-y-1">
                    <p class="text-xs font-medium uppercase tracking-wide text-toned">
                      Lead Measures
                    </p>
                    <p class="font-medium text-highlighted">Weekly inputs that drive the WIG</p>
                  </div>

                  <UButton
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-plus"
                    label="Add Lead Measure"
                    @click="addLeadMeasure"
                  />
                </div>
              </template>

              <div class="space-y-4">
                <div
                  v-for="measure in leadMeasures"
                  :key="`${measure.id}-setup`"
                  class="rounded-2xl border border-default bg-muted/20 p-4"
                >
                  <div class="grid gap-4 md:grid-cols-2">
                    <UFormField label="Lead Measure Name" class="md:col-span-2">
                      <UInput v-model="measure.name" />
                    </UFormField>

                    <UFormField label="Weekly Target">
                      <UInput v-model.number="measure.target" type="number" />
                    </UFormField>

                    <UFormField label="Unit">
                      <UInput v-model="measure.unit" />
                    </UFormField>
                  </div>
                </div>
              </div>

              <template #footer>
                <div class="flex justify-end gap-3">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    label="Cancel"
                    @click="activeSection = 'dashboard'"
                  />
                  <UButton color="primary" label="Save WIG" @click="activeSection = 'dashboard'" />
                </div>
              </template>
            </UCard>
          </div>
        </template>

        <template v-else-if="activeSection === 'daily'">
          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <UCard>
              <template #header>
                <div class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">
                    Daily Execution
                  </p>
                  <p class="font-medium text-highlighted">
                    {{ longDate }}
                  </p>
                </div>
              </template>

              <div class="space-y-4">
                <div
                  v-for="measure in leadMeasures"
                  :key="`${measure.id}-daily`"
                  class="rounded-2xl border border-default p-4"
                >
                  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div class="space-y-1">
                      <p class="font-medium text-highlighted">
                        {{ measure.name }}
                      </p>
                      <p class="text-sm text-muted">
                        {{ measure.target }} {{ measure.unit }} planned this week
                      </p>
                    </div>

                    <div class="flex items-center gap-3">
                      <UButton
                        color="neutral"
                        variant="subtle"
                        icon="i-lucide-minus"
                        @click="decrementToday(measure)"
                      />
                      <p class="min-w-8 text-center text-2xl font-semibold text-highlighted">
                        {{ measure.todayCount }}
                      </p>
                      <UButton
                        color="primary"
                        variant="soft"
                        icon="i-lucide-plus"
                        @click="incrementToday(measure)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <template #footer>
                <div class="flex justify-end">
                  <UButton color="primary" icon="i-lucide-save" label="Save Today's Log" />
                </div>
              </template>
            </UCard>

            <UCard>
              <template #header>
                <div class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-wide text-toned">Past 5 Days</p>
                  <p class="font-medium text-highlighted">Activity snapshot</p>
                </div>
              </template>

              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr
                      class="border-b border-default text-left text-xs uppercase tracking-wide text-toned"
                    >
                      <th class="px-3 py-3 font-medium">Day</th>
                      <th
                        v-for="measure in leadMeasures"
                        :key="`${measure.id}-head`"
                        class="px-3 py-3 text-center font-medium"
                      >
                        {{ measure.name.split(' ')[0] }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, rowIndex) in leadMeasures[0]?.history ?? []"
                      :key="`${row.day}-${rowIndex}`"
                      class="border-b border-default last:border-b-0"
                    >
                      <td class="px-3 py-3 font-medium text-highlighted">
                        {{ row.day
                        }}<span v-if="row.day === 'Fri'" class="text-muted"> (today)</span>
                      </td>
                      <td
                        v-for="measure in leadMeasures"
                        :key="`${measure.id}-${row.day}`"
                        class="px-3 py-3 text-center text-muted"
                      >
                        {{ measure.history[rowIndex]?.value ?? '—' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </UCard>
          </div>
        </template>

        <template v-else>
          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div class="space-y-6">
              <UCard>
                <template #header>
                  <div class="space-y-1">
                    <p class="text-xs font-medium uppercase tracking-wide text-toned">Last Week</p>
                    <p class="font-medium text-highlighted">Commitments vs. Done</p>
                  </div>
                </template>

                <div class="space-y-3">
                  <div
                    v-for="commitment in previousWeekCommitments"
                    :key="commitment.id"
                    class="flex items-start gap-3 rounded-2xl border border-default p-4"
                  >
                    <UCheckbox v-model="commitment.completed" />
                    <p class="text-sm text-highlighted">
                      {{ commitment.text }}
                    </p>
                  </div>
                </div>

                <template #footer>
                  <p class="text-sm text-muted">
                    {{ completedCommitments }} of {{ previousWeekCommitments.length }} completed
                  </p>
                </template>
              </UCard>

              <UCard>
                <template #header>
                  <div class="space-y-1">
                    <p class="text-xs font-medium uppercase tracking-wide text-toned">Scoreboard</p>
                    <p class="font-medium text-highlighted">Last week review</p>
                  </div>
                </template>

                <div class="space-y-4">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-4 text-sm">
                      <span class="font-medium text-highlighted">WIG progress</span>
                      <span class="text-muted"
                        >{{ wig.from }} / {{ wig.to }} ({{ wigProgress }}%)</span
                      >
                    </div>
                    <UProgress :model-value="wigProgress" color="primary" />
                  </div>

                  <div
                    v-for="measure in leadMeasures"
                    :key="`${measure.id}-weekly`"
                    class="rounded-2xl border border-default p-4"
                  >
                    <div class="flex items-center justify-between gap-4">
                      <div class="space-y-1">
                        <p class="font-medium text-highlighted">
                          {{ measure.name }}
                        </p>
                        <p class="text-sm text-muted">
                          {{ weeklyCount(measure) }} / {{ measure.target }} {{ measure.unit }}
                        </p>
                      </div>

                      <UBadge :color="measureStatus(measure).color" variant="subtle">
                        {{ measurePercent(measure) }}%
                      </UBadge>
                    </div>
                  </div>
                </div>
              </UCard>
            </div>

            <UCard>
              <template #header>
                <div class="flex items-center justify-between gap-4">
                  <div class="space-y-1">
                    <p class="text-xs font-medium uppercase tracking-wide text-toned">Next Week</p>
                    <p class="font-medium text-highlighted">I will...</p>
                  </div>
                  <UButton
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-plus"
                    label="Add"
                    @click="addCommitment"
                  />
                </div>
              </template>

              <div class="space-y-3">
                <UFormField
                  v-for="(commitment, index) in nextWeekCommitments"
                  :key="`next-${index}`"
                  :label="`Commitment ${index + 1}`"
                >
                  <UInput v-model="nextWeekCommitments[index]" placeholder="Add a commitment..." />
                </UFormField>
              </div>

              <template #footer>
                <div class="flex justify-end">
                  <UButton color="primary" icon="i-lucide-save" label="Save Commitments" />
                </div>
              </template>
            </UCard>
          </div>
        </template>
      </main>
    </UContainer>
  </div>
</template>
