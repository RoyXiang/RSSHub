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

    const user = ctx.params.user;
    const feed = await parser.parseURL(`https://nyaa.si/?page=rss&u=${encodeURI(user)}`);

    feed.items.map((item) => {
        item.description = item.content;
        item.guid = `magnet:?xt=urn:btih:${item.infoHash}`;
        item.enclosure_url = item.guid;
        item.enclosure_type = 'application/x-bittorrent';
        return item;
    });

    ctx.state.data = {
        title: `Nyaa - ${user} - Torrent File RSS`,
        link: `https://nyaa.si/user/${user}`,
        description: feed.description,
        item: feed.items,
    };
};
