export type ItemGroup = 'all' | 'warframe' | 'weapon' | 'mod' | 'companion' | 'ore' | 'relic' | 'misc'

export interface CatalogItem {
    uniqueName: string
    name: string
    nameEn: string
    type: string
    category: string
    group: Exclude<ItemGroup, 'all'>
    imageName?: string
    isPrime: boolean
}

export interface ItemComponent {
    name: string
    itemCount: number
}

export interface RelicReward {
    name: string
    rarity: string
    isTarget: boolean
    ducats: number | null
    chances: Record<string, number | null>
}

export interface RelicContents {
    key: string
    name: string
    images: Record<string, string | undefined>
    rewards: RelicReward[]
}

export interface ItemDetail extends CatalogItem {
    description: string
    components: ItemComponent[]
    stats: Array<{ label: string; value: string }>
    relics: RelicContents[]
}
