<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const toast = useToast()
const { wig, fetchWig, updateWig, pending } = useWig()

const wigForm = reactive({
  title: '',
  startValue: 0,
  currentValue: 0,
  targetValue: 0,
  unit: '',
  deadline: ''
})

const wigId = computed(() => String(route.params.id || ''))

const progress = computed(() => {
  return Math.max(
    0,
    Math.min(100, Math.round((wigForm.currentValue / Math.max(wigForm.targetValue, 1)) * 100))
  )
})

onMounted(async () => {
  const existingWig = await fetchWig(wigId.value)

  if (!existingWig) {
    throw createError({
      statusCode: 404,
      statusMessage: 'WIG not found'
    })
  }

  wigForm.title = existingWig.title
  wigForm.startValue = existingWig.startValue
  wigForm.currentValue = existingWig.currentValue
  wigForm.targetValue = existingWig.targetValue
  wigForm.unit = existingWig.unit
  wigForm.deadline = existingWig.deadline.slice(0, 10)
})

async function saveWig() {
  try {
    await updateWig(wigId.value, {
      title: wigForm.title,
      startValue: wigForm.startValue,
      currentValue: wigForm.currentValue,
      targetValue: wigForm.targetValue,
      unit: wigForm.unit,
      deadline: wigForm.deadline
    })

    toast.add({
      title: 'WIG updated',
      description: 'Lead measures will live under this page next.',
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
            <p class="text-sm font-medium text-toned">WIG</p>
            <h1 class="text-2xl font-semibold text-highlighted">
              {{ wigForm.title || 'Wildly important goal' }}
            </h1>
            <p class="text-sm text-muted">
              This is the dedicated WIG page where lead measures will be added next.
            </p>
          </div>
        </div>

        <UButton to="/dashboard" color="neutral" variant="subtle" icon="i-lucide-arrow-left" label="Back to dashboard" />
      </UContainer>
    </div>

    <UContainer class="grid gap-6 py-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <p class="text-xs font-medium uppercase tracking-wide text-toned">
              WIG Details
            </p>
            <p class="font-medium text-highlighted">
              Update this goal. Lead measures will sit inside this page next.
            </p>
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Title" class="md:col-span-2">
            <UInput v-model="wigForm.title" />
          </UFormField>

          <UFormField label="Starting point">
            <UInput v-model.number="wigForm.startValue" type="number" />
          </UFormField>

          <UFormField label="Current value">
            <UInput v-model.number="wigForm.currentValue" type="number" />
          </UFormField>

          <UFormField label="Target value">
            <UInput v-model.number="wigForm.targetValue" type="number" />
          </UFormField>

          <UFormField label="Unit">
            <UInput v-model="wigForm.unit" />
          </UFormField>

          <UFormField label="Deadline" class="md:col-span-2">
            <UInput v-model="wigForm.deadline" type="date" />
          </UFormField>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton to="/dashboard" color="neutral" variant="ghost" label="Back" />
            <UButton color="primary" icon="i-lucide-save" label="Save Changes" :loading="pending" @click="saveWig" />
          </div>
        </template>
      </UCard>

      <div class="space-y-6">
        <UCard>
          <template #header>
            <p class="font-medium text-highlighted">Progress</p>
          </template>

          <div class="space-y-4">
            <div class="rounded-2xl border border-default bg-muted/30 p-4">
              <p class="text-xs font-medium uppercase tracking-wide text-toned">Goal</p>
              <h2 class="mt-2 text-xl font-semibold text-highlighted">
                {{ wigForm.startValue }} -> {{ wigForm.targetValue }} {{ wigForm.unit }}
              </h2>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between gap-4 text-sm">
                <span class="font-medium text-highlighted">Current progress</span>
                <span class="text-muted">{{ wigForm.currentValue }} / {{ wigForm.targetValue }}</span>
              </div>
              <UProgress :model-value="progress" color="primary" />
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <p class="font-medium text-highlighted">Next</p>
          </template>

          <p class="text-sm text-muted">
            This page is now the destination for each WIG card. Lead measures and execution logs can be nested here in the next step.
          </p>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>
