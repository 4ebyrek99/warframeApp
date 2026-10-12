import type { CatalogItem, ItemGroup } from '../../shared/types/warframe'
import { getCatalog, sampleItems } from '../utils/warframe-data'

const groups: ItemGroup[] = ['all', 'warframe', 'weapon', 'mod', 'companion', 'ore', 'relic', 'misc']
const sampleGroups: Exclude<ItemGroup, 'all'>[] = ['warframe', 'weapon', 'companion', 'misc', 'mod', 'ore', 'relic']

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const group =
        typeof query.group === 'string' && groups.includes(query.group as ItemGroup)
            ? (query.group as ItemGroup)
            : 'all'
    const primeOnly = query.primeOnly === 'true' || query.primeOnly === '1'
    const search = typeof query.q === 'string' ? query.q.trim().slice(0, 80).toLocaleLowerCase() : ''
    const catalog = await getCatalog()
    const eligible = primeOnly ? catalog.filter((item) => item.isPrime) : catalog
    const filtered = group === 'all' ? eligible : eligible.filter((item) => item.group === group)

    if (search) {
        const results = filtered
            .filter(
                (item) =>
                    item.name.toLocaleLowerCase().includes(search) || item.nameEn.toLocaleLowerCase().includes(search)
            )
            .sort((a, b) => score(a, search) - score(b, search) || a.name.localeCompare(b.name))
            .slice(0, 100)
        return { items: results, total: results.length, search: true }
    }

    const items: CatalogItem[] =
        group === 'all'
            ? (() => {
                  const activeGroups = primeOnly
                      ? sampleGroups.filter((sampleGroup) => !['ore', 'relic'].includes(sampleGroup))
                      : sampleGroups
                  const balanced = activeGroups.flatMap((sampleGroup) =>
                      sampleItems(
                          filtered.filter((item) => item.group === sampleGroup),
                          Math.floor(25 / activeGroups.length)
                      )
                  )
                  const selected = new Set(balanced.map((item) => item.uniqueName))
                  const remainder = sampleItems(
                      filtered.filter((item) => !selected.has(item.uniqueName)),
                      25 - balanced.length
                  )
                  return [...balanced, ...remainder]
              })()
            : sampleItems(filtered, 25)
    return { items: sampleItems(items, items.length), total: filtered.length, search: false }
})

function score(item: CatalogItem, query: string): number {
    const names = [item.name.toLocaleLowerCase(), item.nameEn.toLocaleLowerCase()]
    if (names.some((name) => name === query)) return 0
    if (names.some((name) => name.startsWith(query))) return 1
    if (names.some((name) => name.split(/\s+/).some((word) => word.startsWith(query)))) return 2
    return 3
}
