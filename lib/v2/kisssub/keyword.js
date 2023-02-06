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

    const { keyword = '' } = ctx.params;
    const feed_url = keyword ? `https://kisssub.org/rss-${encodeURI(keyword)}.xml` : 'https://kisssub.org/rss.xml';
    const feed = await parser.parseURL(feed_url);

    feed.items.map((item) => {
        item.description = item.content;
        item.guid = `magnet:?xt=urn:btih:${item.enclosure.url.substr(-40)}`;
        item.enclosure_url = item.enclosure.url;
        item.enclosure_type = item.enclosure.type;
        item.enclosure_length = item.enclosure.length;
        return item;
    });

    ctx.state.data = {
        title: keyword ? `爱恋动漫BT下载 - ${keyword}` : feed.title,
        link: 'https://kisssub.org/',
        description: feed.description,
        item: feed.items,
    };
};
