import type { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';
import { getRouteLimit } from '@/utils/route-limit';

export const route: Route = {
    path: '/:tags{.+}?',
    categories: ['anime'],
    example: '/bangumi.moe',
    parameters: {
        tags: 'Tags, empty by default, multiple tags separated by `/`',
    },
    features: {
        supportBT: true,
    },
    radar: [
        {
            source: ['bangumi.moe/'],
        },
    ],
    name: 'Latest',
    maintainers: ['nczitzk'],
    handler,
    url: 'bangumi.moe/',
};

async function handler(ctx) {
    const { tags } = ctx.req.param();
    const isLatest = !tags;
    const rootUrl = 'https://bangumi.moe';
    const invalidTag = 'invalid tag';

    let response;
    let tagIds: string[] = [];
    let tagNames: string[] = [];

    if (isLatest) {
        const apiUrl = `${rootUrl}/api/torrent/latest`;

        response = await got({
            method: 'get',
            url: apiUrl,
        });
    } else {
        const tagUrl = `${rootUrl}/api/tag/search`;
        const torrentUrl = `${rootUrl}/api/torrent/search`;

        const params = tags.split('/');

        const tagResults = await Promise.all(
            params.map((param) =>
                cache.tryGet(param, async () => {
                    const paramResponse = await got({
                        method: 'post',
                        url: tagUrl,
                        json: {
                            name: decodeURIComponent(param),
                            keywords: true,
                            multi: true,
                        },
                    });

                    return paramResponse.data.found ? paramResponse.data.tag[0] : invalidTag;
                })
            )
        );
        tagIds = tagResults.map((tag) => (tag === invalidTag ? '' : tag._id)).filter((t) => t !== '');
        tagNames = tagResults.map((tag) => (tag === invalidTag ? '' : tag.name)).filter((t) => t !== '');

        response = await got({
            method: 'post',
            url: torrentUrl,
            json: {
                tag_id: tagIds,
            },
        });
    }

    let items =
        response.data.torrents?.slice(0, getRouteLimit(ctx, 30)).map((item) => ({
            title: item.title,
            link: `${rootUrl}/torrent/${item._id}`,
            guid: item.magnet,
            description: item.introduction,
            pubDate: parseDate(item.publish_time),
            enclosure_url: `${rootUrl}/download/torrent/${item._id}/${encodeURIComponent(item.title)}.torrent`,
            enclosure_type: 'application/x-bittorrent',
            category: item.tag_ids,
        })) ?? [];

    items = await Promise.all(
        items.map((item) =>
            cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'post',
                    url: `${rootUrl}/api/tag/fetch`,
                    json: {
                        _ids: item.category,
                    },
                });

                item.category = [];

                for (const tag of detailResponse.data) {
                    for (const t of tag.synonyms) {
                        item.category.push(t);
                    }
                }

                return item;
            })
        )
    );

    return {
        title: '萌番组 Bangumi Moe' + (tagNames.length === 0 ? '' : ' - ' + tagNames.map((n) => `[${n}]`).join('')),
        link: isLatest || items.length === 0 ? rootUrl : `${rootUrl}/search/${tagIds.join('+')}`,
        item: items,
        allowEmpty: true,
    };
}
