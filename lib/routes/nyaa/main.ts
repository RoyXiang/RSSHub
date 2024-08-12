import { Data, DataItem, Route } from '@/types';
import { config } from '@/config';
import Parser from 'rss-parser';

export const route: Route = {
    path: ['/search/:query?', '/user/:username?', '/user/:username/search/:query?', '/sukebei/search/:query?', '/sukebei/user/:username?', '/sukebei/user/:username/search/:query?'],
    categories: ['multimedia'],
    example: '/nyaa/search/psycho-pass',
    parameters: { query: 'Search keyword' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: true,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Search Result',
    maintainers: ['Lava-Swimmer', 'noname1776', 'camera-2018'],
    handler,
};

interface NyaaFields {
    magnet: string;
    infoHash: string;
    categoryId: string;
}
type NyaaItem = DataItem & NyaaFields;

async function handler(ctx): Promise<Data> {
    const parser = new Parser<Data, NyaaItem>({
        customFields: {
            item: ['magnet', ['nyaa:infoHash', 'infoHash'], ['nyaa:categoryId', 'categoryId'], ['nyaa:category', 'category', { keepArray: true }]],
        },
        headers: {
            'User-Agent': config.ua,
        },
    });

    const { query, username } = ctx.req.param();

    const rootURL = ctx.req.path.split('/')[2] === 'sukebei' ? 'https://sukebei.nyaa.si' : 'https://nyaa.si';

    let currentRSSURL = `${rootURL}/?page=rss`;
    let currentLink = `${rootURL}/`;
    const currentTitle: string[] = [];
    if (username !== undefined) {
        currentRSSURL = `${currentRSSURL}&u=${encodeURI(username)}`;
        currentLink = `${currentLink}user/${encodeURI(username)}`;
        currentTitle.push(`[${username}]`);
    }
    if (query !== undefined) {
        currentRSSURL = `${currentRSSURL}&q=${encodeURI(query)}`;
        currentLink = `${currentLink}?q=${encodeURI(query)}`;
        currentTitle.push(query);
    }
    if (currentTitle.length === 0) {
        currentTitle.push('Home');
    }

    const feed = await parser.parseURL(currentRSSURL);

    feed.items.map((item) => {
        const magnetUri = `magnet:?xt=urn:btih:${item.infoHash}`;
        item.description = item.content;
        item.category?.push(item.categoryId);
        item.enclosure_url = rootURL === 'https://nyaa.si' ? item.link : magnetUri;
        item.enclosure_type = 'application/x-bittorrent';
        item.link = item.guid;
        item.guid = magnetUri;
        return item;
    });

    return {
        title: `Nyaa - ${currentTitle.join(' ')} - Torrent File RSS`,
        link: currentLink,
        description: feed.description,
        item: feed.items,
        allowEmpty: true,
    };
}
