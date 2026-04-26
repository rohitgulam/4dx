<template>
  <div class="min-h-screen bg-default">
    <header class="border-b border-default bg-elevated/80 backdrop-blur">
      <UContainer class="flex items-center justify-between gap-4 py-4">
        <NuxtLink to="/" class="flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
          >
            <UIcon name="i-lucide-target" class="size-5" />
          </div>
          <div>
            <p class="font-semibold text-highlighted">4DX</p>
            <p class="text-sm text-muted">Personal execution tool</p>
          </div>
        </NuxtLink>

        <div class="flex items-center gap-2">
          <UButton to="/login" label="Login" color="neutral" variant="subtle" />
          <UButton to="/register" label="Register" />
        </div>
      </UContainer>
    </header>

    <UMain>
      <slot />
    </UMain>
  </div>
</template>
