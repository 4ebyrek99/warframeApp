<script setup lang="ts">
const { favorites, toggleItem } = useFavorites()

function imageUrl(imageName?: string) {
    return imageName ? `https://cdn.warframestat.us/img/${encodeURIComponent(imageName)}` : ''
}
</script>

<template>
    <main class="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header class="space-y-2">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Warframe App</p>
            <h1 class="text-3xl font-semibold sm:text-4xl">Избранное</h1>
            <p class="text-surface-600 dark:text-surface-300">
                Сохранённые предметы и реликвии доступны в этом браузере.
            </p>
        </header>

        <div
            v-if="!favorites.items.length && !favorites.relics.length"
            class="rounded-2xl border border-surface-200 bg-surface-0 p-6 dark:border-surface-800 dark:bg-surface-900"
        >
            Здесь пока пусто. Откройте <NuxtLink to="/" class="font-medium text-primary underline">каталог</NuxtLink> и
            сохраните предмет или реликвию.
        </div>

        <section v-if="favorites.items.length" class="space-y-4">
            <h2 class="text-2xl font-semibold">Предметы</h2>
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <article
                    v-for="item in favorites.items"
                    :key="item.uniqueName"
                    class="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-800 dark:bg-surface-900"
                >
                    <img
                        v-if="item.imageName"
                        :src="imageUrl(item.imageName)"
                        :alt="item.name"
                        class="h-14 w-14 rounded-lg bg-surface-100 object-contain p-1 dark:bg-surface-800"
                        loading="lazy"
                    />
                    <NuxtLink
                        :to="{ path: '/', query: { item: item.uniqueName } }"
                        class="min-w-0 flex-1 font-medium text-primary hover:underline"
                    >
                        {{ item.name }}
                    </NuxtLink>
                    <Button
                        label="Убрать"
                        severity="secondary"
                        text
                        size="small"
                        :aria-label="`Убрать ${item.name} из избранного`"
                        @click="toggleItem(item)"
                    />
                </article>
            </div>
        </section>

        <section v-if="favorites.relics.length" class="space-y-4">
            <h2 class="text-2xl font-semibold">Реликвии</h2>
            <div v-for="entry in favorites.relics" :key="entry.relic.key" class="space-y-2">
                <p class="text-sm text-surface-600 dark:text-surface-300">
                    Предмет:
                    <NuxtLink
                        :to="{ path: '/', query: { item: entry.sourceItemId } }"
                        class="font-medium text-primary hover:underline"
                    >
                        {{ entry.sourceItemName }}
                    </NuxtLink>
                </p>
                <RelicPanel
                    :relic="entry.relic"
                    :source-item-id="entry.sourceItemId"
                    :source-item-name="entry.sourceItemName"
                    initially-open
                />
            </div>
        </section>
    </main>
</template>
