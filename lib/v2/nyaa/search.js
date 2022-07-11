const config = require('@/config').value;
const Parser = require('rss-parser');

module.exports = async (ctx) => {
    const parser = new Parser({
        customFields: {
            item: ['magnet', ['nyaa:infoHash', 'infoHash']],
        },
        headers: {
            'User-Agent': config.ua,
        },
    });

    const rootURL = ctx.routerPath.split('/')[1] === 'sukebei' ? 'https://sukebei.nyaa.si' : 'https://nyaa.si';
    const { query = '' } = ctx.params;

    const feed = await parser.parseURL(`${rootURL}/?page=rss&c=0_0&f=0&q=${encodeURI(query)}`);

    feed.items.map((item) => {
        item.description = item.content;
        item.enclosure_url = item.link;
        item.enclosure_type = 'application/x-bittorrent';
        item.link = item.guid;
        item.guid = `magnet:?xt=urn:btih:${item.infoHash}`;
        return item;
    });

    ctx.state.data = {
        title: `Nyaa - ${query} - Torrent File RSS`,
        link: `${rootURL}/?f=0&c=0_0&q=${query}`,
        description: feed.description,
        item: feed.items,
    };
};
