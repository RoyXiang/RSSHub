import { Route } from '@/types';
import { getSubPath } from '@/utils/common-utils';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/moe/*',
    radar: [
        {
            source: ['bangumi.moe/'],
            target: '/moe',
        },
    ],
    name: 'Unknown',
    maintainers: [],
    handler,
    url: 'bangumi.moe/',
    example: '/bangumi/moe',
};

async function handler(ctx) {
    const isLatest = getSubPath(ctx) === '/moe';
    const rootUrl = 'https://bangumi.moe';
    const invalidTag = 'invalid tag';

    let response;
    let tag_id: string[] = [];
    let tag_names: string[] = [];

    if (isLatest) {
        const apiUrl = `${rootUrl}/api/torrent/latest`;

        response = await got({
            method: 'get',
            url: apiUrl,
        });
    } else {
        const tagUrl = `${rootUrl}/api/tag/search`;
        const torrentUrl = `${rootUrl}/api/torrent/search`;

        const params = getSubPath(ctx).split('/').slice(2);

        const tags = await Promise.all(
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
        tag_id = tags.map((tag) => (tag === invalidTag ? '' : tag._id)).filter((t) => t !== '');
        tag_names = tags.map((tag) => (tag === invalidTag ? '' : tag.name)).filter((t) => t !== '');

        response = await got({
            method: 'post',
            url: torrentUrl,
            json: {
                tag_id,
            },
        });
    }

    let items =
        response.data.torrents?.slice(0, ctx.req.query('limit') ? Number.parseInt(ctx.req.query('limit')) : 30).map((item) => ({
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
        title: '萌番组 Bangumi Moe' + (tag_names.length === 0 ? '' : ' - ' + tag_names.map((n) => `[${n}]`).join('')),
        link: isLatest || items.length === 0 ? rootUrl : `${rootUrl}/search/${tag_id.join('+')}`,
        item: items,
        allowEmpty: true,
    };
}
