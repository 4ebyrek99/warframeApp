import type { CatalogItem, RelicContents } from '../../shared/types/warframe'

interface FavoriteRelic {
    relic: RelicContents
    sourceItemId: string
    sourceItemName: string
}

interface Favorites {
    items: CatalogItem[]
    relics: FavoriteRelic[]
}

const storageKey = 'warframe-app-favorites-v1'

export function useFavorites() {
    const favorites = useState<Favorites>('warframe-favorites', () => ({ items: [], relics: [] }))
    const loaded = useState('warframe-favorites-loaded', () => false)

    onMounted(() => {
        if (loaded.value) return
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
            favorites.value = {
                items: Array.isArray(saved.items) ? saved.items : [],
                relics: Array.isArray(saved.relics) ? saved.relics : []
            }
        } catch {
            favorites.value = { items: [], relics: [] }
        }
        loaded.value = true
    })

    function save() {
        if (import.meta.client) localStorage.setItem(storageKey, JSON.stringify(favorites.value))
    }

    function hasItem(id: string) {
        return favorites.value.items.some((item) => item.uniqueName === id)
    }

    function hasRelic(key: string) {
        return favorites.value.relics.some((entry) => entry.relic.key === key)
    }

    function toggleItem(item: CatalogItem) {
        favorites.value.items = hasItem(item.uniqueName)
            ? favorites.value.items.filter((entry) => entry.uniqueName !== item.uniqueName)
            : [...favorites.value.items, item]
        save()
    }

    function toggleRelic(relic: RelicContents, sourceItemId: string, sourceItemName: string) {
        favorites.value.relics = hasRelic(relic.key)
            ? favorites.value.relics.filter((entry) => entry.relic.key !== relic.key)
            : [...favorites.value.relics, { relic, sourceItemId, sourceItemName }]
        save()
    }

    return { favorites, hasItem, hasRelic, toggleItem, toggleRelic }
}
