<script setup lang="ts">
import type { RelicContents } from '../../shared/types/warframe'

const props = defineProps<{
    relic: RelicContents
    sourceItemId: string
    sourceItemName: string
    initiallyOpen?: boolean
}>()

const { hasRelic, toggleRelic } = useFavorites()
const refinements = [
    { key: 'Intact', label: 'Нетронутая' },
    { key: 'Exceptional', label: 'Необычная' },
    { key: 'Flawless', label: 'Бесподобная' },
    { key: 'Radiant', label: 'Сияющая' }
]
const rarityNames: Record<string, string> = {
    Common: 'Обычная',
    Uncommon: 'Необычная',
    Rare: 'Редкая'
}
const selectedRefinement = ref('Radiant')
const copyStatus = ref('')
let statusTimer: ReturnType<typeof setTimeout> | undefined

const selectedLabel = computed(() => refinements.find((entry) => entry.key === selectedRefinement.value)?.label || '')

function imageUrl(imageName?: string) {
    return imageName ? `https://cdn.warframestat.us/img/${encodeURIComponent(imageName)}` : ''
}

function formatChance(chance: number | null | undefined) {
    return chance == null ? '—' : `${chance.toLocaleString('ru-RU')}%`
}

async function copyMessage() {
    const message = `[${props.relic.name}] ${selectedLabel.value} +3`
    try {
        await navigator.clipboard.writeText(message)
        copyStatus.value = 'Скопировано'
    } catch {
        copyStatus.value = 'Не удалось скопировать'
    }
    clearTimeout(statusTimer)
    statusTimer = setTimeout(() => (copyStatus.value = ''), 3000)
}

onBeforeUnmount(() => clearTimeout(statusTimer))
</script>

<template>
    <details
        :open="initiallyOpen"
        class="relic-panel rounded-xl border border-surface-200 bg-surface-0 dark:border-surface-800 dark:bg-surface-900"
    >
        <summary class="cursor-pointer px-5 py-4 font-semibold text-primary">
            {{ relic.name }} — {{ relic.rewards.length }} наград
        </summary>
        <div class="space-y-4 border-t border-surface-200 p-4 dark:border-surface-800 sm:p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p class="mb-2 text-sm font-medium">Улучшение реликвии</p>
                    <div class="flex flex-wrap gap-2" role="group" :aria-label="`Улучшение: ${relic.name}`">
                        <button
                            v-for="refinement in refinements"
                            :key="refinement.key"
                            type="button"
                            :aria-pressed="selectedRefinement === refinement.key"
                            class="flex w-24 flex-col items-center gap-1 rounded-xl border p-2 text-center text-xs transition-colors hover:border-primary sm:w-28"
                            :class="
                                selectedRefinement === refinement.key
                                    ? 'border-primary bg-primary-50 dark:bg-primary-950'
                                    : 'border-surface-200 dark:border-surface-700'
                            "
                            @click="selectedRefinement = refinement.key"
                        >
                            <img
                                v-if="relic.images?.[refinement.key]"
                                :src="imageUrl(relic.images[refinement.key])"
                                :alt="`${relic.name}: ${refinement.label}`"
                                class="h-16 w-16 object-contain"
                                loading="lazy"
                            />
                            <span>{{ refinement.label }}</span>
                        </button>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <Button label="Копировать" severity="secondary" outlined size="small" @click="copyMessage" />
                    <Button
                        :label="hasRelic(relic.key) ? 'В избранном' : 'В избранное'"
                        :severity="hasRelic(relic.key) ? 'success' : 'secondary'"
                        outlined
                        size="small"
                        @click="toggleRelic(relic, sourceItemId, sourceItemName)"
                    />
                    <span v-if="copyStatus" role="status" class="text-sm text-surface-500">{{ copyStatus }}</span>
                </div>
            </div>
            <div class="overflow-x-auto">
                <DataTable
                    :value="relic.rewards"
                    size="small"
                    :row-class="(reward) => (reward.isTarget ? 'target-reward' : '')"
                >
                    <Column header="Награда">
                        <template #body="{ data }">
                            <span :class="data.isTarget ? 'font-semibold text-primary' : ''">{{ data.name }}</span>
                        </template>
                    </Column>
                    <Column header="Редкость">
                        <template #body="{ data }">{{ rarityNames[data.rarity] || data.rarity }}</template>
                    </Column>
                    <Column header="Дукаты">
                        <template #body="{ data }">{{ data.ducats ?? '—' }}</template>
                    </Column>
                    <Column :header="`Шанс: ${selectedLabel}`">
                        <template #body="{ data }">{{ formatChance(data.chances[selectedRefinement]) }}</template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </details>
</template>

<style>
.relic-panel .target-reward {
    background: color-mix(in srgb, var(--p-primary-color) 9%, transparent);
}
</style>
