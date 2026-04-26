<script setup lang="ts">
definePageMeta({
  layout: false,
})

const toast = useToast()
const { createWig, pending } = useWig()

const wigForm = reactive({
  title: 'Increase paying users',
  startValue: 53,
  currentValue: 53,
  targetValue: 150,
  unit: 'paying users',
  deadline: '2025-09-30',
})

async function saveWig() {
  try {
    const createdWig = await createWig({
      title: wigForm.title,
      startValue: wigForm.startValue,
      currentValue: wigForm.currentValue,
      targetValue: wigForm.targetValue,
      unit: wigForm.unit,
      deadline: wigForm.deadline,
    })

    toast.add({
      title: 'WIG saved',
      description: 'Your wildly important goal has been created.',
      color: 'success',
    })

    await navigateTo(`/wigs/${createdWig.id}`)
  } catch (error) {
    const description =
      typeof error === 'object' && error !== null && 'data' in error
        ? String(
            (error as { data?: { statusMessage?: string } }).data?.statusMessage ||
              'Failed to save WIG'
          )
        : 'Failed to save WIG'

    toast.add({
      title: 'Unable to save WIG',
      description,
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
            <UIcon name="i-lucide-flag" class="size-5" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-toned">WIG Setup</p>
            <h1 class="text-2xl font-semibold text-highlighted">Create a wildly important goal</h1>
            <p class="text-sm text-muted">
              Define the lag measure first. Lead measures and logging can hang off this record next.
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
        </div>
      </UContainer>
    </div>

    <UContainer class="grid gap-6 py-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <p class="text-xs font-medium uppercase tracking-wide text-toned">WIG Details</p>
            <p class="font-medium text-highlighted">This form saves directly to the new WIG API.</p>
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Title" class="md:col-span-2">
            <UInput v-model="wigForm.title" placeholder="Increase paying users" />
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
            <UInput v-model="wigForm.unit" placeholder="paying users" />
          </UFormField>

          <UFormField label="Deadline" class="md:col-span-2">
            <UInput v-model="wigForm.deadline" type="date" />
          </UFormField>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton to="/dashboard" color="neutral" variant="ghost" label="Cancel" />
            <UButton
              color="primary"
              icon="i-lucide-save"
              label="Save WIG"
              :loading="pending"
              @click="saveWig"
            />
          </div>
        </template>
      </UCard>

      <div class="space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-target" class="size-4 text-primary" />
              <p class="font-medium text-highlighted">Preview</p>
            </div>
          </template>

          <div class="space-y-4">
            <div class="rounded-2xl border border-default bg-muted/30 p-4">
              <p class="text-xs font-medium uppercase tracking-wide text-toned">Goal</p>
              <h2 class="mt-2 text-xl font-semibold text-highlighted">
                {{ wigForm.startValue }} -> {{ wigForm.targetValue }} {{ wigForm.unit }}
              </h2>
              <p class="mt-1 text-sm text-muted">
                {{ wigForm.title }}
              </p>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between gap-4 text-sm">
                <span class="font-medium text-highlighted">Current progress</span>
                <span class="text-muted"
                  >{{ wigForm.currentValue }} / {{ wigForm.targetValue }}</span
                >
              </div>
              <UProgress
                :model-value="
                  Math.max(
                    0,
                    Math.min(
                      100,
                      Math.round((wigForm.currentValue / Math.max(wigForm.targetValue, 1)) * 100)
                    )
                  )
                "
                color="primary"
              />
            </div>

            <div class="rounded-2xl border border-default p-4">
              <p class="text-xs font-medium uppercase tracking-wide text-toned">Deadline</p>
              <p class="mt-2 font-medium text-highlighted">
                {{
                  new Date(wigForm.deadline).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <p class="font-medium text-highlighted">What happens next</p>
          </template>

          <p class="text-sm text-muted">
            After save, this WIG opens on its own detail page. That page is where lead measures will live next.
          </p>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>
