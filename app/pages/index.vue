<template>
  <div>
    <UPageHero
      title="4DX for founders, operators, and execution-focused teams"
      description="A focused system for turning one wildly important goal into a weekly operating rhythm. Review the scoreboard, log the lead measures, and make next week’s commitments visible."
      :links="[
        {
          label: 'Open dashboard',
          to: '/login',
          trailingIcon: 'i-lucide-arrow-right',
          size: 'xl',
        },
        {
          label: 'Create account',
          to: '/register',
          icon: 'i-lucide-user-plus',
          size: 'xl',
          color: 'neutral',
          variant: 'subtle',
        },
      ]"
    >
      <template #headline>
        <UBadge color="primary" variant="subtle" label="Nuxt UI prototype" />
      </template>
    </UPageHero>

    <UPageSection
      title="Built around the four 4DX moments"
      description="The UI maps directly to the concept: dashboard, WIG setup, daily execution, and weekly review."
      :features="[
        {
          icon: 'i-lucide-layout-dashboard',
          title: 'Dashboard',
          description:
            'A single-screen scoreboard with lag and lead indicators, plus a quick daily pulse.',
        },
        {
          icon: 'i-lucide-flag',
          title: 'WIG setup',
          description: 'Define the main goal, set the deadline, and tune the weekly lead measures.',
        },
        {
          icon: 'i-lucide-calendar-days',
          title: 'Daily log',
          description:
            'Capture the actions completed today and keep the running weekly total visible.',
        },
        {
          icon: 'i-lucide-target',
          title: 'Weekly review',
          description: 'Compare commitments against outcomes and write the next set of promises.',
        },
      ]"
    />
  </div>
</template>
