# Warframe App

Проект на Nuxt 4 с PrimeVue 4 (тема Aura, primary Emerald, surface Soho) и Tailwind CSS 3. Компоненты PrimeVue доступны в шаблонах, например `<Button label="Открыть" />`. Плагин `tailwindcss-primeui` добавляет цвета темы, например `text-primary` и `text-surface-600`.

## Запуск

Требуется Node.js версии, поддерживаемой установленным Nuxt: `^22.21.0`, `^24.11.0` или `>=26`.

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`. Для проверки production-сборки выполните `npm run build`.

## Форматирование

Исходники и конфигурация используют четыре пробела для отступов. Выполните `npm run format` для форматирования, `npm run format:check` для проверки стиля и `npm run typecheck` для проверки типов; правило отступов также записано в `.editorconfig`.

## Каталог и реликвии

Главная страница показывает случайную подборку в PrimeVue DataTable. Переключатель «Только Prime» включён по умолчанию; если его выключить, появятся обычные предметы, моды, руда и реликвии. Фильтр выбирает варфреймы, оружие, моды, компаньонов, руду, реликвии и разное. В «Компаньонов» входят питомцы, стражи и их оружие. К руде относятся необработанные минералы, а сплавы и огранённые камни остаются в «Разном». При выборе руды или реликвий переключатель Prime выключается автоматически. Поиск по русскому или английскому названию автоматически открывает сведения о первом совпадении; другую строку можно выбрать нажатием. Для Prime-предметов показываются реликвии с русскими названиями и полным списком наград. Уровень улучшения выбирается изображением реликвии: таблица показывает шанс для выбранного уровня, редкость и стоимость награды в дукатах. Прочерк означает, что в Warframe Market значение дукатов отсутствует. Кнопка «Копировать» создаёт сообщение вида `[Реликвия Нео O2] Сияющая +3`.

Предметы и реликвии можно сохранить кнопкой «В избранное». Отдельная страница `/favorites` показывает сохранённые записи. Они хранятся в `localStorage` текущего браузера и не синхронизируются между устройствами.

Серверные маршруты приложения:

| Маршрут                                                       | Назначение                                                                                                                                                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/catalog?group=warframe&q=Рино Прайм&primeOnly=true` | Поиск; без `q` возвращается случайная подборка. `group`: `all`, `warframe`, `weapon`, `mod`, `companion`, `ore`, `relic`, `misc`. `primeOnly=true` оставляет только Prime-предметы. |
| `GET /api/item-detail?id=<uniqueName>`                        | Описание предмета, компоненты, характеристики и содержимое реликвий. `uniqueName` берите из ответа каталога.                                                                        |

Каталог, описания и изображения улучшений поступают из [Warframe Status API](https://docs.warframestat.us/), состав реликвий и шансы — из [WFCD Drop Data](https://github.com/WFCD/warframe-drop-data). Русские названия деталей Prime и значения дукатов берутся из [списка предметов Warframe Market](https://docs.warframe.market/docs/api/manifests/) и сопоставляются с наградами реликвий по английскому названию, а с компонентами — по игровому ID. Сервер кэширует исходные данные на час. Если перевод недоступен или Market API временно не отвечает, отображается исходное название.

## Как обращаться к API Warframe

Для мировых событий и данных предметов можно использовать [Warframe Status API](https://docs.warframestat.us/) от сообщества WFCD. Это не официальный API Digital Extremes. Базовый адрес: `https://api.warframestat.us`.

| Данные               | Запрос                                                  |
| -------------------- | ------------------------------------------------------- |
| Разломы Бездны на PC | `GET https://api.warframestat.us/pc/fissures`           |
| Цикл Цетуса          | `GET https://api.warframestat.us/pc/cetusCycle`         |
| Варфреймы на русском | `GET https://api.warframestat.us/warframes?language=ru` |

Для worldstate платформа находится в пути (`pc`, `ps4`, `psn`, `xb1`, `swi`, `ns`). Согласно текущей документации, запросы для платформ кроме PC могут перенаправляться на PC. Для локализованных предметов используйте `language=ru` или `Accept-Language: ru`. Ответ worldstate и ответ каталога имеют разные структуры, поэтому типизируйте каждый endpoint отдельно.

Пример в Nuxt: создайте `server/api/warframe/fissures.get.ts`:

```ts
export default defineCachedEventHandler(() => $fetch('https://api.warframestat.us/pc/fissures'), { maxAge: 60 })
```

Затем в компоненте:

```vue
<script setup lang="ts">
const { data: fissures, status, error } = await useFetch('/api/warframe/fissures')
</script>
```

Кэш `maxAge` подбирайте под скорость изменения конкретных данных. Обрабатывайте `error` и пустые ответы в интерфейсе.

## Как обращаться к API Warframe Market

Используйте [документированный API v2](https://docs.warframe.market/docs/api/overview/) с базовым адресом `https://api.warframe.market/v2/`. Публичные запросы чтения не требуют авторизации. Старые примеры для `/v1/items/.../orders` имеют другую структуру и не подходят для v2.

| Данные                      | Запрос                           |
| --------------------------- | -------------------------------- |
| Список торгуемых предметов  | `GET /v2/items`                  |
| Предмет по slug             | `GET /v2/item/{slug}`            |
| Все видимые ордера предмета | `GET /v2/orders/item/{slug}`     |
| Лучшие предложения онлайн   | `GET /v2/orders/item/{slug}/top` |

Получайте `slug` из ответа `/v2/items`, а не составляйте его из названия вручную. У большинства JSON-ответов полезные данные находятся в поле `data`; поля верхнего уровня — `apiVersion`, `data`, `error`. Формат `data` зависит от endpoint: для `/orders/item/{slug}` это массив, для `/orders/item/{slug}/top` — объект с массивами `sell` и `buy`.

Контекст запроса задаётся заголовками: `Language: ru` для локализации, `Platform: pc` для платформы и, где поддерживается, `Crossplay: true`. Допустимые значения платформы: `pc`, `ps4`, `xbox`, `switch`, `mobile`. Если заголовки не указаны, используются `en`, `pc` и `false`. Не путайте `Language` в Market с `Accept-Language` в Warframe Status.

Для серверного запроса создайте `server/api/market/orders/[slug].get.ts`:

```ts
type MarketResponse<T> = {
    apiVersion: string
    data: T | null
    error: unknown | null
}

export default defineCachedEventHandler(
    async (event) => {
        const slug = getRouterParam(event, 'slug')
        if (!slug || !/^[a-z0-9_]+$/.test(slug)) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid item slug' })
        }

        const response = await $fetch<MarketResponse<unknown[]>>(`https://api.warframe.market/v2/orders/item/${slug}`, {
            headers: {
                'User-Agent': 'WarframeApp/0.1.0 (+https://github.com/your-name/your-repo)',
                Language: 'ru',
                Platform: 'pc',
                Crossplay: 'true'
            }
        })

        if (response.error || !response.data) {
            throw createError({ statusCode: 502, statusMessage: 'Market API error' })
        }

        return response.data
    },
    { maxAge: 30 }
)
```

Замените адрес в `User-Agent` на реальный адрес проекта или контакт. [Правила Warframe Market](https://docs.warframe.market/docs/rules/overview/) просят указывать узнаваемый `User-Agent`, кэшировать данные и избегать частого опроса. Общий публичный лимит сейчас — 3 запроса в секунду; при `429` уменьшайте частоту и учитывайте `Retry-After`, если он есть. Не делайте многократные запросы ко всему каталогу при каждом открытии страницы.

Для чтения собственных ордеров и изменения объявлений нужна авторизация. [OAuth 2.0](https://docs.warframe.market/docs/oauth/overview/) пока не доступен сторонним разработчикам, а описанный [v2 Sign In](https://docs.warframe.market/docs/api/authentication/) предназначен только для собственных клиентов сервиса. Документация отсылает сторонние интеграции к существующему v1-потоку авторизации; проверьте его актуальные условия перед реализацией. Токены храните на сервере, не помещайте их в `runtimeConfig.public` или клиентский код. Для просмотра цен авторизация не нужна.

Источники: [Warframe Status API](https://docs.warframestat.us/), [Warframe Market API overview](https://docs.warframe.market/docs/api/overview/), [предметы](https://docs.warframe.market/docs/api/manifests/), [ордера](https://docs.warframe.market/docs/api/orders/), [правила интеграций](https://docs.warframe.market/docs/rules/overview/).
