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

    const teamId = ctx.params.teamId;
    const feed = await parser.parseURL(`https://share.dmhy.org/topics/rss/team_id/${encodeURI(teamId)}/rss.xml`);

    feed.items.map((item) => {
        item.enclosure_url = item.enclosure.url;
        item.enclosure_type = item.enclosure.type;
        return item;
    });

    ctx.state.data = {
        title: feed.title,
        link: `https://share.dmhy.org/topics/list/team_id/${teamId}`,
        description: feed.description,
        item: feed.items,
    };
};
