<template>
    <div class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-950 dark:text-surface-50">
        <NuxtRouteAnnouncer />
        <nav
            class="flex items-center gap-5 border-b border-surface-200 px-4 py-4 text-sm font-medium dark:border-surface-800 sm:px-6 lg:px-8"
        >
            <NuxtLink to="/" class="text-primary">Warframe App</NuxtLink>
            <NuxtLink to="/" active-class="text-primary" class="hover:text-primary">Каталог</NuxtLink>
            <NuxtLink to="/favorites" active-class="text-primary" class="hover:text-primary">Избранное</NuxtLink>
        </nav>
        <NuxtPage />
    </div>
</template>
