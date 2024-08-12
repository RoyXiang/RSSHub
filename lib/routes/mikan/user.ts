import { config } from '@/config';
import { Data, DataItem, Route } from '@/types';
import { Context } from 'hono';
import Parser from 'rss-parser';

export const route: Route = {
    path: ['/user/:token'],
    name: 'User Feed',
    example: '/mikan/user/token',
    parameters: { token: 'User Token' },
    maintainers: ['RoyXiang'],
    handler,
};

type Torrent = {
    pubDate: string[];
};
type Enclosure = {
    url: string;
    type: string;
    length: number;
};
interface MikanFields {
    link: string;
    torrent: Torrent;
    enclosure: Enclosure;
}
type MikanItem = DataItem & MikanFields;

async function handler(ctx: Context): Promise<Data> {
    const parser = new Parser<Data, MikanItem>({
        customFields: {
            item: ['torrent', 'enclosure'],
        },
        headers: {
            'User-Agent': config.ua,
        },
    });

    const token: string = ctx.req.param('token');
    const feed = await parser.parseURL(`https://mikanani.me/RSS/MyBangumi?token=${encodeURI(token)}`);

    feed.items.map((item) => {
        const idx = item.link.lastIndexOf(':') + 1;
        item.guid = `magnet:?xt=urn:btih:${item.link.substring(idx)}`;
        item.pubDate = item.torrent.pubDate[0];
        item.enclosure_url = item.enclosure.url;
        item.enclosure_type = item.enclosure.type;
        item.enclosure_length = item.enclosure.length;
        return item;
    });

    return {
        title: feed.title,
        link: 'https://mikanani.me/',
        description: feed.description,
        item: feed.items,
        allowEmpty: true,
    };
}
