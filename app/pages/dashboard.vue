<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { user, clear } = useUserSession()
const { wigs, fetchWigs, pending } = useWig()

const weekLabel = computed(() => {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const sameMonth = monday.getMonth() === sunday.getMonth()
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' })

  if (sameMonth) {
    return `Week of ${monday.getDate()} - ${sunday.getDate()} ${monthFormatter.format(sunday)}`
  }

  return `Week of ${monday.getDate()} ${monthFormatter.format(monday)} - ${sunday.getDate()} ${monthFormatter.format(sunday)}`
})

onMounted(async () => {
  await fetchWigs()
})

function wigProgress(currentValue: number, targetValue: number) {
  return Math.max(0, Math.min(100, Math.round((currentValue / Math.max(targetValue, 1)) * 100)))
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
            <h1 class="text-2xl font-semibold text-highlighted">4 Disciplines</h1>
          </div>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="rounded-xl border border-default bg-default px-4 py-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-calendar-range" class="size-4 text-primary" />
              <p class="text-sm font-medium text-highlighted">
                {{ weekLabel }}
              </p>
            </div>
          </div>
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

    <UContainer class="py-6">
      <main class="space-y-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-toned">WIGs</p>
            <div class="flex items-center gap-x-2">
              <h2 class="text-xl font-semibold text-highlighted">All wildly important goals</h2>
              <UBadge size="sm" color="neutral" variant="subtle"> {{ wigs.length }} total </UBadge>
            </div>
          </div>
          <UButton to="/wig" color="primary" icon="i-lucide-plus" label="Create WIG" />
        </div>

        <div v-if="pending" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <USkeleton v-for="index in 3" :key="index" class="h-52 rounded-2xl" />
        </div>

        <div
          v-else-if="wigs.length === 0"
          class="rounded-2xl border border-dashed border-default bg-muted/20 p-10 text-center"
        >
          <div
            class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <UIcon name="i-lucide-flag" class="size-5" />
          </div>
          <h3 class="mt-4 text-lg font-semibold text-highlighted">No WIGs yet</h3>
          <p class="mt-2 text-sm text-muted">
            Create your first wildly important goal to start tracking execution.
          </p>
          <div class="mt-6">
            <UButton to="/wig" color="primary" icon="i-lucide-plus" label="Create WIG" />
          </div>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <NuxtLink
            v-for="record in wigs"
            :key="record.id"
            :to="`/wigs/${record.id}`"
            class="block"
          >
            <UCard
              class="h-full transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <template #header>
                <div class="flex items-start justify-between gap-3">
                  <div class="space-y-1">
                    <p class="text-xs font-medium uppercase tracking-wide text-toned">WIG</p>
                    <h3 class="text-lg font-semibold text-highlighted">
                      {{ record.title }}
                    </h3>
                  </div>
                  <UIcon name="i-lucide-arrow-up-right" class="size-4 text-primary" />
                </div>
              </template>

              <div class="space-y-4">
                <div class="rounded-2xl border border-default bg-muted/30 p-4">
                  <p class="text-sm font-medium text-highlighted">
                    {{ record.startValue }} -> {{ record.targetValue }} {{ record.unit }}
                  </p>
                  <p class="mt-1 text-sm text-muted">
                    Current: {{ record.currentValue }} {{ record.unit }}
                  </p>
                </div>

                <div class="space-y-2">
                  <div class="flex items-center justify-between gap-4 text-sm">
                    <span class="font-medium text-highlighted">Progress</span>
                    <span class="text-muted"
                      >{{ wigProgress(record.currentValue, record.targetValue) }}%</span
                    >
                  </div>
                  <UProgress
                    :model-value="wigProgress(record.currentValue, record.targetValue)"
                    color="primary"
                  />
                </div>

                <div class="flex items-center justify-between gap-4 text-sm text-muted">
                  <span>Deadline</span>
                  <span>{{
                    new Date(record.deadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }}</span>
                </div>
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </main>
    </UContainer>
  </div>
</template>
