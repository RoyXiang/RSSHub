import { load } from 'cheerio';
import type { Context } from 'hono';

import type { Data, DataItem, Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: ['/team/:team/:keyword?', '/:keyword?'],
    name: 'Search Result',
    example: '/dmhy',
    parameters: { keyword: 'Keyword', team: 'Team' },
    maintainers: ['RoyXiang'],
    handler,
};

const baseUrl = 'https://share.dmhy.org';
const dlUrl = 'https://dl.dmhy.org';

async function handler(ctx: Context): Promise<Data> {
    const { team, keyword } = ctx.req.param();
    let pageUrl = `${baseUrl}/topics/list`;
    if (team) {
        pageUrl += `/team_id/${encodeURIComponent(team)}`;
    }
    if (keyword) {
        pageUrl += `?keyword=${encodeURIComponent(keyword)}`;
    }

    const response = await cache.tryGet(pageUrl, async () => {
        const { data: resp } = await got(pageUrl);
        return resp;
    });
    const $ = load(response as string);

    const items: DataItem[] = $.root()
        .find('#topic_list tbody > tr')
        .toArray()
        .map((item) => {
            const row = $(item);
            const title = row.find('.title > a');
            const pubDate = parseDate(row.find('td:nth-child(1) > span').text());
            const month = pubDate.getMonth() + 1;

            const magnetUrl = row.find('td:nth-child(4) .download-xl').attr('data-magnet') || decodeURIComponent(row.find('td:nth-child(4) .download-pp').attr('href') ?? '');
            const magnetHash = magnetUrl.slice(magnetUrl.lastIndexOf(':') + 1);

            return {
                title: title.text().trim(),
                link: `${baseUrl}${title.attr('href')}`,
                guid: `magnet:?xt=urn:btih:${magnetHash}`,
                category: [row.find('td:nth-child(2)').text().trim()],
                author: row.find('.title .tag').text().trim(),
                enclosure_url: `${dlUrl}/${pubDate.getFullYear()}/${month.toString().padStart(2, '0')}/${pubDate.getDate().toString().padStart(2, '0')}/${magnetHash}.torrent`,
                enclosure_type: 'application/x-bittorrent',
                pubDate,
            };
        });

    let titleSuffix = '';
    if (team && items.length > 0) {
        titleSuffix += ` [${items[0].author}]`;
    }
    if (keyword) {
        titleSuffix += ` ${keyword}`;
    }
    if (titleSuffix !== '') {
        titleSuffix = ` -${titleSuffix}`;
    }
    return {
        title: `動漫花園資源網${titleSuffix}`,
        link: pageUrl,
        description: '動漫花園資訊網是一個動漫愛好者交流的平台,提供最及時,最全面的動畫,漫畫,動漫音樂,動漫下載,BT,ED,動漫遊戲,資訊,分享,交流,讨论.',
        item: items,
        allowEmpty: true,
    };
}
