const config = require('@/config').value;
const Parser = require('rss-parser');

module.exports = async (ctx) => {
    const parser = new Parser({
        customFields: {
            item: ['enclosure', 'torrent'],
        },
        headers: {
            'User-Agent': config.ua,
        },
    });

    const token = ctx.params.token;
    const feed = await parser.parseURL(`https://mikanani.me/RSS/MyBangumi?token=${encodeURI(token)}`);

    feed.items.map((item) => {
        item.guid = `magnet:?xt=urn:btih:${item.link.substr(-40)}`;
        item.link = item.enclosure.url;
        item.pubDate = item.torrent.pubDate[0];
        item.enclosure_url = item.enclosure.url;
        item.enclosure_type = item.enclosure.type;
        return item;
    });

    ctx.state.data = {
        title: feed.title,
        link: 'https://mikanani.me',
        description: feed.description,
        item: feed.items,
        allowEmpty: true,
    };
};
