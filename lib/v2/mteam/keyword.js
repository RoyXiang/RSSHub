const config = require('@/config').value;
const Parser = require('rss-parser');

module.exports = async (ctx) => {
    const passkey = config.mteam.passkey;
    if (passkey === undefined) {
        throw Error('缺少 M-Team 的配置信息');
    }

    const parser = new Parser({
        customFields: {
            item: ['enclosure'],
        },
        headers: {
            'User-Agent': config.ua,
        },
    });

    const { keyword = '' } = ctx.params;
    const feed_url = `https://kp.m-team.cc/torrentrss.php?https=1&rows=50&linktype=dl&search=${encodeURI(keyword)}`;
    const feed = await parser.parseURL(`${feed_url}&passkey=${passkey}`);

    feed.items.map((item) => {
        item.description = item.content;
        item.guid = `magnet:?xt=urn:btih:${item.guid}`;
        item.link = item.enclosure.url;
        item.enclosure_url = item.enclosure.url;
        item.enclosure_type = item.enclosure.type;
        return item;
    });

    ctx.state.data = {
        title: `${feed.title} - ${keyword}`,
        link: 'https://kp.m-team.cc/',
        description: feed.description,
        item: feed.items,
    };
};
