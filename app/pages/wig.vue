<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import { calculateWigProgress } from '../utils/wig-progress'

definePageMeta({
  layout: false,
})

const toast = useToast()
const { createWig, pending } = useWig()
const deadline = shallowRef<CalendarDate | null>(null)

const wigForm = reactive({
  title: '',
  description: '',
  startValue: 0,
  currentValue: 0,
  targetValue: 0,
  unit: '',
})

async function saveWig() {
  try {
    const createdWig = await createWig({
      title: wigForm.title,
      description: wigForm.description || null,
      startValue: wigForm.startValue,
      currentValue: wigForm.currentValue,
      targetValue: wigForm.targetValue,
      unit: wigForm.unit,
      deadline: deadline.value ? deadline.value.toString() : '',
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
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Title" class="md:col-span-2">
            <UInput v-model="wigForm.title" class="w-full" size="lg" />
          </UFormField>

          <UFormField label="Description" class="md:col-span-2">
            <UTextarea v-model="wigForm.description" :rows="3" class="w-full" />
          </UFormField>

          <UFormField label="Starting point">
            <UInput v-model.number="wigForm.startValue" type="number" class="w-full" size="lg" />
          </UFormField>

          <UFormField label="Current value">
            <UInput v-model.number="wigForm.currentValue" type="number" class="w-full" size="lg" />
          </UFormField>

          <UFormField label="Target value">
            <UInput v-model.number="wigForm.targetValue" type="number" class="w-full" size="lg" />
          </UFormField>

          <UFormField label="Unit">
            <UInput v-model="wigForm.unit" class="w-full" size="lg" />
          </UFormField>

          <UFormField label="Deadline" class="md:col-span-2">
            <UInputDate v-model="deadline" class="w-full" size="lg" />
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
              <p v-if="wigForm.title" class="mt-1 text-sm text-muted">
                {{ wigForm.title }}
              </p>
              <p v-if="wigForm.description" class="mt-1 text-sm text-muted">
                {{ wigForm.description }}
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
                  calculateWigProgress(wigForm.startValue, wigForm.currentValue, wigForm.targetValue)
                "
                color="primary"
              />
            </div>

            <div class="rounded-2xl border border-default p-4">
              <p class="text-xs font-medium uppercase tracking-wide text-toned">Deadline</p>
              <p v-if="deadline" class="mt-2 font-medium text-highlighted">
                {{
                  new Date(deadline.toString()).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }}
              </p>
              <p v-else class="mt-2 text-sm text-muted">No date selected</p>
            </div>
          </div>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>
