import { getCatalog, getItemDetail } from '../utils/warframe-data'

export default defineEventHandler(async (event) => {
    const id = getQuery(event).id
    if (typeof id !== 'string' || !id.startsWith('/Lotus/') || id.length > 250) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid item ID' })
    }

    const item = (await getCatalog()).find((candidate) => candidate.uniqueName === id)
    if (!item) throw createError({ statusCode: 404, statusMessage: 'Item not found' })
    return getItemDetail(item)
})
