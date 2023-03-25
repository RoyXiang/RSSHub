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

    const { query, username } = ctx.params;

    let rootURL;
    if (ctx.routerPath.split('/')[1] === 'sukebei') {
        rootURL = 'https://sukebei.nyaa.si';
    } else {
        rootURL = 'https://nyaa.si';
    }

    let currentRSSURL = `${rootURL}/?page=rss`;
    let currentLink = `${rootURL}/`;
    let currentTitle = [];
    if (username !== undefined) {
        currentRSSURL = `${currentRSSURL}&u=${encodeURI(username)}`;
        currentLink = `${currentLink}user/${encodeURI(username)}`;
        currentTitle = [`[${username}]`];
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
        item.enclosure_url = rootURL === 'https://nyaa.si' ? item.link : magnetUri;
        item.enclosure_type = 'application/x-bittorrent';
        item.link = item.guid;
        item.guid = magnetUri;
        return item;
    });

    ctx.state.data = {
        title: `Nyaa - ${currentTitle.join(' ')} - Torrent File RSS`,
        link: currentLink,
        description: feed.description,
        item: feed.items,
        allowEmpty: true,
    };
};
