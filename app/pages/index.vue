<script setup lang="ts">
import type { CatalogItem, ItemDetail, ItemGroup } from '../../shared/types/warframe'

interface CatalogResponse {
    items: CatalogItem[]
    total: number
    search: boolean
}

const allGroups: Array<{ label: string; value: ItemGroup }> = [
    { label: 'Все категории', value: 'all' },
    { label: 'Варфреймы', value: 'warframe' },
    { label: 'Оружие', value: 'weapon' },
    { label: 'Моды', value: 'mod' },
    { label: 'Компаньоны', value: 'companion' },
    { label: 'Руда', value: 'ore' },
    { label: 'Реликвии', value: 'relic' },
    { label: 'Разное', value: 'misc' }
]
const groupNames: Record<Exclude<ItemGroup, 'all'>, string> = {
    warframe: 'Варфрейм',
    weapon: 'Оружие',
    mod: 'Мод',
    companion: 'Компаньон',
    ore: 'Руда',
    relic: 'Реликвия',
    misc: 'Разное'
}
const group = ref<ItemGroup>('all')
const primeOnly = ref(true)
const searchInput = ref('')
const search = ref('')
const route = useRoute()
const selectedId = ref<string | null>(typeof route.query.item === 'string' ? route.query.item : null)
const { hasItem, toggleItem } = useFavorites()
let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(searchInput, (value) => {
    clearTimeout(searchTimer)
    if (!value.trim()) {
        search.value = ''
        return
    }
    searchTimer = setTimeout(() => {
        search.value = value.trim()
    }, 350)
})
onBeforeUnmount(() => clearTimeout(searchTimer))
watch(primeOnly, (enabled) => {
    if (enabled && (group.value === 'ore' || group.value === 'relic')) group.value = 'all'
})
watch(group, (selected) => {
    if (selected === 'ore' || selected === 'relic') primeOnly.value = false
})

function submitSearch() {
    clearTimeout(searchTimer)
    search.value = searchInput.value.trim()
}

const {
    data: catalog,
    status: catalogStatus,
    error: catalogError,
    refresh: refreshCatalog
} = await useAsyncData(
    'warframe-catalog',
    () =>
        $fetch<CatalogResponse>('/api/catalog', {
            query: { group: group.value, q: search.value, primeOnly: primeOnly.value }
        }),
    { watch: [group, search, primeOnly] }
)

watch([group, search, primeOnly], () => {
    selectedId.value = null
})
watch(
    () => route.query.item,
    (id) => {
        if (typeof id === 'string') selectedId.value = id
    }
)
watch(catalog, (result) => {
    if (search.value) selectedId.value = result?.items[0]?.uniqueName ?? null
})

const {
    data: detail,
    status: detailStatus,
    error: detailError
} = await useAsyncData(
    'warframe-item-detail',
    () =>
        selectedId.value
            ? $fetch<ItemDetail>('/api/item-detail', { query: { id: selectedId.value } })
            : Promise.resolve(null),
    { watch: [selectedId] }
)

function selectItem(item: CatalogItem) {
    selectedId.value = item.uniqueName
}

function imageUrl(imageName?: string) {
    return imageName ? `https://cdn.warframestat.us/img/${encodeURIComponent(imageName)}` : ''
}

function groupLabel(value: string) {
    return groupNames[value as Exclude<ItemGroup, 'all'>] || value
}
</script>

<template>
    <main
        class="min-h-screen bg-surface-50 px-4 py-8 text-surface-900 dark:bg-surface-950 dark:text-surface-50 sm:px-6 lg:px-8"
    >
        <div class="w-full space-y-7">
            <header class="space-y-2">
                <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Warframe App</p>
                <h1 class="text-3xl font-semibold sm:text-4xl">Каталог предметов</h1>
                <p class="max-w-3xl text-surface-600 dark:text-surface-300">
                    Выберите категорию и просмотрите случайные предметы. Включите фильтр Prime, чтобы оставить только
                    Prime-предметы, и найдите нужный предмет для просмотра реликвий.
                </p>
            </header>

            <div
                class="grid items-start gap-6 lg:grid-cols-[minmax(0,40%)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,38%)_minmax(0,1fr)]"
            >
                <section
                    class="min-w-0 rounded-2xl border border-surface-200 bg-surface-0 p-4 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-6"
                >
                    <form class="mb-5 flex flex-col gap-3" @submit.prevent="submitSearch">
                        <label class="sr-only" for="item-search">Поиск предмета</label>
                        <InputText
                            id="item-search"
                            v-model="searchInput"
                            class="w-full"
                            placeholder="Название предмета: Рино Прайм или Rhino Prime"
                            autocomplete="off"
                        />
                        <div class="flex flex-col gap-3 sm:flex-row">
                            <Select
                                v-model="group"
                                :options="allGroups"
                                option-label="label"
                                option-value="value"
                                class="w-full sm:min-w-0 sm:flex-1"
                                aria-label="Категория предметов"
                            />
                            <Button
                                v-if="!searchInput"
                                label="Другие предметы"
                                severity="secondary"
                                outlined
                                @click="refreshCatalog()"
                            />
                            <Button v-else type="submit" label="Найти" />
                        </div>
                        <label class="flex w-fit cursor-pointer items-center gap-3 text-sm font-medium">
                            <ToggleSwitch v-model="primeOnly" />
                            Только Prime
                        </label>
                    </form>

                    <Message v-if="catalogError" severity="error" class="mb-4">
                        Не удалось загрузить каталог. Проверьте соединение и попробуйте снова.
                    </Message>

                    <div
                        class="mb-3 flex items-center justify-between gap-3 text-sm text-surface-500 dark:text-surface-400"
                    >
                        <span>{{
                            search ? `Результаты поиска: ${catalog?.items.length ?? 0}` : 'Случайная подборка предметов'
                        }}</span>
                        <span v-if="catalogStatus === 'pending'">Загрузка…</span>
                    </div>

                    <div class="overflow-x-auto">
                        <DataTable
                            :value="catalog?.items ?? []"
                            data-key="uniqueName"
                            paginator
                            :rows="12"
                            :rows-per-page-options="[12, 24, 48]"
                            size="small"
                            striped-rows
                            :loading="catalogStatus === 'pending'"
                            class="catalog-table"
                            @row-click="selectItem($event.data)"
                        >
                            <template #empty>
                                {{ search ? 'По вашему запросу ничего не найдено.' : 'Предметов пока нет.' }}
                            </template>
                            <Column header="Предмет">
                                <template #body="{ data }">
                                    <div class="flex min-w-48 items-center gap-3 py-1">
                                        <img
                                            v-if="data.imageName"
                                            :src="imageUrl(data.imageName)"
                                            :alt="data.name"
                                            loading="lazy"
                                            class="h-11 w-11 rounded-lg bg-surface-100 object-contain p-1 dark:bg-surface-800"
                                        />
                                        <div class="min-w-0">
                                            <div class="flex flex-wrap items-center gap-2 font-medium">
                                                <span>{{ data.name }}</span>
                                                <Tag v-if="data.isPrime" value="Prime" severity="success" />
                                            </div>
                                            <div
                                                v-if="data.name !== data.nameEn"
                                                class="text-xs text-surface-500 dark:text-surface-400"
                                            >
                                                {{ data.nameEn }}
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </Column>
                            <Column header="Категория">
                                <template #body="{ data }">{{ groupLabel(data.group) }}</template>
                            </Column>
                        </DataTable>
                    </div>
                </section>

                <section class="min-w-0 space-y-5">
                    <div
                        v-if="!selectedId"
                        class="rounded-2xl border border-surface-200 bg-surface-0 p-8 text-surface-600 shadow-sm dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300"
                    >
                        Выберите предмет в таблице или начните поиск, чтобы увидеть его описание и реликвии.
                    </div>
                    <Message v-else-if="detailError" severity="error"
                        >Не удалось загрузить сведения о предмете.</Message
                    >
                    <div v-else-if="detailStatus === 'pending'" class="flex items-center gap-3 text-surface-500">
                        <ProgressSpinner style="width: 24px; height: 24px" stroke-width="4" /> Загрузка описания и
                        реликвий…
                    </div>
                    <template v-else-if="detail">
                        <section
                            class="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-7"
                        >
                            <div class="flex flex-col gap-5 sm:flex-row">
                                <img
                                    v-if="detail.imageName"
                                    :src="imageUrl(detail.imageName)"
                                    :alt="detail.name"
                                    class="h-32 w-32 rounded-xl bg-surface-100 object-contain p-3 dark:bg-surface-800"
                                />
                                <div class="min-w-0 flex-1 space-y-3">
                                    <div class="flex flex-wrap items-center gap-3">
                                        <h2 class="text-2xl font-semibold">{{ detail.name }}</h2>
                                        <Tag v-if="detail.isPrime" value="Prime" severity="success" />
                                        <Tag :value="groupNames[detail.group]" severity="secondary" />
                                        <Button
                                            :label="hasItem(detail.uniqueName) ? 'В избранном' : 'В избранное'"
                                            :severity="hasItem(detail.uniqueName) ? 'success' : 'secondary'"
                                            outlined
                                            size="small"
                                            @click="toggleItem(detail)"
                                        />
                                    </div>
                                    <p v-if="detail.name !== detail.nameEn" class="text-sm text-surface-500">
                                        {{ detail.nameEn }}
                                    </p>
                                    <p class="max-w-4xl leading-relaxed text-surface-700 dark:text-surface-200">
                                        {{ detail.description || 'Описание предмета недоступно.' }}
                                    </p>
                                    <div v-if="detail.stats.length" class="flex flex-wrap gap-2 pt-1">
                                        <span
                                            v-for="stat in detail.stats"
                                            :key="stat.label"
                                            class="rounded-lg bg-surface-100 px-3 py-2 text-sm dark:bg-surface-800"
                                        >
                                            <span class="text-surface-500 dark:text-surface-400"
                                                >{{ stat.label }}:</span
                                            >
                                            {{ stat.value }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div
                                v-if="detail.components.length"
                                class="mt-6 border-t border-surface-200 pt-5 dark:border-surface-800"
                            >
                                <h3 class="mb-3 font-semibold">Компоненты</h3>
                                <div class="flex flex-wrap gap-2">
                                    <span
                                        v-for="component in detail.components"
                                        :key="component.name"
                                        class="rounded-lg border border-surface-200 px-3 py-1.5 text-sm dark:border-surface-700"
                                    >
                                        {{ component.name
                                        }}<span v-if="component.itemCount > 1"> × {{ component.itemCount }}</span>
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section class="space-y-4">
                            <div>
                                <h2 class="text-2xl font-semibold">Реликвии и их содержимое</h2>
                                <p class="text-sm text-surface-600 dark:text-surface-300">
                                    {{
                                        detail.relics.length
                                            ? `Найдено реликвий: ${detail.relics.length}. Откройте реликвию, чтобы увидеть все награды.`
                                            : 'Для этого предмета награды из реликвий не найдены.'
                                    }}
                                </p>
                            </div>
                            <RelicPanel
                                v-for="(relic, index) in detail.relics"
                                :key="relic.key"
                                :relic="relic"
                                :source-item-id="detail.uniqueName"
                                :source-item-name="detail.name"
                                :initially-open="index === 0"
                            />
                        </section>
                    </template>
                </section>
            </div>
        </div>
    </main>
</template>

<style>
.catalog-table .p-datatable-tbody > tr {
    cursor: pointer;
}
</style>
