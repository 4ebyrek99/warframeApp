import type { CatalogItem, ItemDetail, ItemGroup, RelicContents, RelicReward } from '../../shared/types/warframe'

interface RawItem {
    uniqueName?: string
    name?: string
    type?: string
    category?: string
    description?: string
    imageName?: string
    isPrime?: boolean
    components?: Array<{ name?: string; uniqueName?: string; itemCount?: number }>
    masteryReq?: number
    health?: number
    shield?: number
    armor?: number
    energy?: number
    sprint?: number
    criticalChance?: number
    criticalMultiplier?: number
}

interface RawRelic {
    tier: string
    relicName: string
    state: string
    rewards: Array<{ itemName: string; rarity: string; chance: number }>
}

interface MarketItem {
    gameRef?: string
    ducats?: number
    i18n?: { en?: { name?: string }; ru?: { name?: string } }
}

interface LocalizedNames {
    byEnglish: Map<string, string>
    byUniqueName: Map<string, string>
    ducatsByEnglish: Map<string, number>
}

const allowedCategories = new Set([
    'Warframes',
    'Primary',
    'Secondary',
    'Melee',
    'Arch-Gun',
    'Arch-Melee',
    'SentinelWeapons',
    'Resources',
    'Mods',
    'Relics',
    'Gear',
    'Arcanes',
    'Misc',
    'Pets',
    'Sentinels',
    'Fish',
    'Archwing',
    'Skins'
])
const weaponCategories = new Set(['Primary', 'Secondary', 'Melee', 'Arch-Gun', 'Arch-Melee'])
const companionCategories = new Set(['Pets', 'Sentinels', 'SentinelWeapons'])
const relicTiers: Record<string, string> = {
    Lith: 'Лит',
    Meso: 'Мезо',
    Neo: 'Нео',
    Axi: 'Акси',
    Requiem: 'Реквием',
    Vanguard: 'Авангард'
}
const refinements = ['Intact', 'Exceptional', 'Flawless', 'Radiant'] as const
const extraRewardNames: Record<string, string> = {
    '1200X Kuva': 'Кува × 1200',
    '2X Forma Blueprint': 'Форма (Чертеж) × 2',
    'Exilus Weapon Adapter Blueprint': 'Адаптер Эксилус для оружия (Чертеж)',
    'Forma Blueprint': 'Форма (Чертеж)'
}
const componentNames: Record<string, string> = {
    Blueprint: 'Чертеж',
    Chassis: 'Каркас',
    Neuroptics: 'Нейрооптика',
    Systems: 'Система',
    Barrel: 'Ствол',
    Receiver: 'Приёмник',
    Stock: 'Приклад',
    Blade: 'Лезвие',
    Handle: 'Рукоять',
    Link: 'Соединение'
}

let catalogCache: { items: CatalogItem[]; expiresAt: number } | undefined
let catalogPending: Promise<CatalogItem[]> | undefined
let relicImages = new Map<string, string>()
let relicCache: { items: RawRelic[]; expiresAt: number } | undefined
let relicPending: Promise<RawRelic[]> | undefined
let marketCache: { names: LocalizedNames; expiresAt: number } | undefined
let marketPending: Promise<LocalizedNames> | undefined

function nameKey(name: string): string {
    return name.trim().toLocaleLowerCase('en')
}

function getGroup(item: RawItem): Exclude<ItemGroup, 'all'> {
    if (item.category === 'Warframes') return 'warframe'
    if (item.type === 'Companion Weapon' || item.uniqueName?.includes('/Sentinels/SentinelWeapons/')) return 'companion'
    if (item.category && weaponCategories.has(item.category)) return 'weapon'
    if (item.category === 'Mods') return 'mod'
    if (item.category && companionCategories.has(item.category)) return 'companion'
    if (item.category === 'Resources' && /\/Gems\/.*Ore[A-Z]Item$/.test(item.uniqueName || '')) return 'ore'
    if (item.category === 'Relics') return 'relic'
    return 'misc'
}

async function fetchCatalog(): Promise<CatalogItem[]> {
    const query = { only: 'name,uniqueName,type,category,imageName,isPrime' }
    const [english, russian] = await Promise.all([
        $fetch<RawItem[]>('https://api.warframestat.us/items', { query: { ...query, language: 'en' } }),
        $fetch<RawItem[]>('https://api.warframestat.us/items', { query: { ...query, language: 'ru' } })
    ])
    const localized = new Map(russian.filter((item) => item.uniqueName).map((item) => [item.uniqueName, item.name]))
    relicImages = new Map(
        english
            .filter((item) => item.category === 'Relics' && item.name && item.imageName)
            .map((item) => [item.name!, item.imageName!])
    )

    return english
        .filter((item): item is RawItem & { uniqueName: string; name: string; category: string } =>
            Boolean(item.uniqueName && item.name && item.category && allowedCategories.has(item.category))
        )
        .filter((item) => item.category !== 'Relics' || item.name.endsWith(' Intact'))
        .map((item) => ({
            uniqueName: item.uniqueName,
            name: localized.get(item.uniqueName) || item.name,
            nameEn: item.name,
            type: item.type || item.category,
            category: item.category,
            group: getGroup(item),
            imageName: item.imageName,
            isPrime: Boolean(item.isPrime)
        }))
}

export async function getCatalog(): Promise<CatalogItem[]> {
    if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache.items
    catalogPending ||= fetchCatalog()
        .then((items) => {
            catalogCache = { items, expiresAt: Date.now() + 60 * 60 * 1000 }
            return items
        })
        .finally(() => {
            catalogPending = undefined
        })
    return catalogPending
}

async function getRelics(): Promise<RawRelic[]> {
    if (relicCache && relicCache.expiresAt > Date.now()) return relicCache.items
    relicPending ||= $fetch<{ relics: RawRelic[] }>('https://drops.warframestat.us/data/relics.json')
        .then((response) => {
            relicCache = { items: response.relics, expiresAt: Date.now() + 60 * 60 * 1000 }
            return response.relics
        })
        .finally(() => {
            relicPending = undefined
        })
    return relicPending
}

async function getMarketNames(): Promise<LocalizedNames> {
    if (marketCache && marketCache.expiresAt > Date.now()) return marketCache.names
    marketPending ||= $fetch<{ data: MarketItem[] }>('https://api.warframe.market/v2/items', {
        headers: {
            Language: 'ru',
            'User-Agent': 'WarframeApp/0.1.0 (+https://github.com/4ebyrek99/warframeApp)'
        }
    })
        .then((response) => {
            if (!Array.isArray(response.data)) throw new Error('Invalid Warframe Market item manifest')
            const names: LocalizedNames = { byEnglish: new Map(), byUniqueName: new Map(), ducatsByEnglish: new Map() }
            for (const entry of response.data) {
                const english = entry.i18n?.en?.name
                const russian = entry.i18n?.ru?.name
                if (english && russian) names.byEnglish.set(nameKey(english), russian)
                if (entry.gameRef && russian) names.byUniqueName.set(entry.gameRef, russian)
                if (english && typeof entry.ducats === 'number')
                    names.ducatsByEnglish.set(nameKey(english), entry.ducats)
            }
            marketCache = { names, expiresAt: Date.now() + 60 * 60 * 1000 }
            return names
        })
        .finally(() => {
            marketPending = undefined
        })
    return marketPending
}

export function sampleItems(items: CatalogItem[], size: number): CatalogItem[] {
    const copy = [...items]
    for (let i = 0; i < Math.min(size, copy.length); i++) {
        const j = i + Math.floor(Math.random() * (copy.length - i))
        const current = copy[i]!
        copy[i] = copy[j]!
        copy[j] = current
    }
    return copy.slice(0, size)
}

function relevantRelic(relic: RawRelic, item: CatalogItem): boolean {
    if (relic.state !== 'Intact') return false
    if (item.group === 'relic') {
        const match = item.nameEn.match(/^(Lith|Meso|Neo|Axi|Requiem|Vanguard)\s+(\S+)\s+Intact$/i)
        return Boolean(
            match &&
            relic.tier.toLowerCase() === match[1]?.toLowerCase() &&
            relic.relicName?.toLowerCase() === match[2]?.toLowerCase()
        )
    }
    return relic.rewards.some(
        ({ itemName }) => itemName === item.nameEn || (item.isPrime && itemName.startsWith(`${item.nameEn} `))
    )
}

function toRelicContents(
    base: RawRelic,
    all: Map<string, RawRelic>,
    item: CatalogItem,
    names: LocalizedNames
): RelicContents {
    const key = `${base.tier} ${base.relicName}`
    const states = Object.fromEntries(refinements.map((state) => [state, all.get(`${key} ${state}`)])) as Record<
        string,
        RawRelic | undefined
    >
    const rewards: RelicReward[] = base.rewards.map((reward) => ({
        name: names.byEnglish.get(nameKey(reward.itemName)) || extraRewardNames[reward.itemName] || reward.itemName,
        ducats: names.ducatsByEnglish.get(nameKey(reward.itemName)) ?? null,
        // В наборе WFCD некоторые обычные награды помечены как Uncommon.
        // Для стандартной реликвии редкость однозначно следует из шанса целой реликвии.
        rarity: reward.chance >= 20 ? 'Common' : reward.chance >= 5 ? 'Uncommon' : 'Rare',
        isTarget: reward.itemName === item.nameEn || (item.isPrime && reward.itemName.startsWith(`${item.nameEn} `)),
        chances: Object.fromEntries(
            refinements.map((state) => [
                state,
                states[state]?.rewards.find((candidate) => candidate.itemName === reward.itemName)?.chance ?? null
            ])
        )
    }))
    const rarityOrder: Record<string, number> = { Common: 0, Uncommon: 1, Rare: 2 }
    rewards.sort((a, b) => (rarityOrder[a.rarity] ?? 3) - (rarityOrder[b.rarity] ?? 3) || a.name.localeCompare(b.name))
    const nameEn = base.tier === 'Requiem' && base.relicName === 'ETERNA' ? 'Requiem Eterna Relic' : `${key} Intact`
    const relicName = base.relicName === 'ETERNA' ? 'Этерна' : base.relicName
    return {
        key,
        name:
            names.byEnglish.get(nameKey(nameEn)) ||
            `Реликвия ${relicTiers[base.tier] || base.tier} ${relicName}`.trim(),
        images: Object.fromEntries(refinements.map((state) => [state, relicImages.get(`${key} ${state}`)])),
        rewards
    }
}

const statFields: Array<[keyof RawItem, string]> = [
    ['masteryReq', 'Ранг мастерства'],
    ['health', 'Здоровье'],
    ['shield', 'Щиты'],
    ['armor', 'Броня'],
    ['energy', 'Энергия'],
    ['sprint', 'Скорость'],
    ['criticalChance', 'Шанс крита'],
    ['criticalMultiplier', 'Множитель крита']
]

export async function getItemDetail(item: CatalogItem): Promise<ItemDetail> {
    const [raw, relics, catalog, marketNames] = await Promise.all([
        $fetch<RawItem>(`https://api.warframestat.us/items/${encodeURIComponent(item.uniqueName)}`, {
            query: { by: 'uniqueName', language: 'ru', remove: 'patchlogs' }
        }),
        getRelics(),
        getCatalog(),
        getMarketNames().catch((): LocalizedNames => ({
            byEnglish: new Map(),
            byUniqueName: new Map(),
            ducatsByEnglish: new Map()
        }))
    ])
    const names: LocalizedNames = {
        byEnglish: new Map(catalog.map((entry) => [nameKey(entry.nameEn), entry.name])),
        byUniqueName: new Map(catalog.map((entry) => [entry.uniqueName, entry.name])),
        ducatsByEnglish: marketNames.ducatsByEnglish
    }
    for (const [english, russian] of marketNames.byEnglish) names.byEnglish.set(english, russian)
    for (const [uniqueName, russian] of marketNames.byUniqueName) names.byUniqueName.set(uniqueName, russian)
    const allRelics = new Map(relics.map((relic) => [`${relic.tier} ${relic.relicName} ${relic.state}`, relic]))
    const matches = relics.filter((relic) => relevantRelic(relic, item))
    const uniqueMatches = [...new Map(matches.map((relic) => [`${relic.tier} ${relic.relicName}`, relic])).values()]

    return {
        ...item,
        description: raw.description || '',
        components: (raw.components || [])
            .filter((component) => component.name)
            .map((component) => ({
                name:
                    (component.uniqueName && names.byUniqueName.get(component.uniqueName)) ||
                    componentNames[component.name!] ||
                    names.byEnglish.get(nameKey(component.name!)) ||
                    component.name!,
                itemCount: component.itemCount || 1
            })),
        stats: statFields.flatMap(([field, label]) => {
            const value = raw[field]
            return typeof value === 'number' ? [{ label, value: String(value) }] : []
        }),
        relics: uniqueMatches
            .map((relic) => toRelicContents(relic, allRelics, item, names))
            .sort((a, b) => a.name.localeCompare(b.name))
    }
}
