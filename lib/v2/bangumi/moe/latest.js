const config = require('@/config').value;
const Parser = require('rss-parser');

module.exports = async (ctx) => {
    const parser = new Parser({
        customFields: {
            item: ['enclosure'],
        },
        headers: {
            'User-Agent': config.ua,
        },
    });

    const feed = await parser.parseURL('https://bangumi.moe/rss/latest');

    feed.items.map((item) => {
        item.description = item.content;
        item.enclosure_url = encodeURI(item.enclosure.url);
        item.enclosure_type = item.enclosure.type;
        return item;
    });

    ctx.state.data = {
        title: feed.title,
        link: 'https://bangumi.moe/',
        description: feed.description,
        item: feed.items,
    };
};
