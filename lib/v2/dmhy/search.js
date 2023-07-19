const cheerio = require('cheerio');

const got = require('@/utils/got');
const { parseDate } = require('@/utils/parse-date');

const baseUrl = 'https://share.dmhy.org';
const dlUrl = 'https://dl.dmhy.org';

module.exports = async (ctx) => {
    const { team, keyword } = ctx.params;
    let pageUrl = `${baseUrl}/topics/list`;
    if (team) {
        pageUrl += `/team_id/${encodeURIComponent(team)}`;
    }
    if (keyword) {
        pageUrl += `?keyword=${encodeURIComponent(keyword)}`;
    }

    const { data: response } = await got(pageUrl);
    const $ = cheerio.load(response);

    const items = $.root()
        .find('#topic_list tbody > tr')
        .toArray()
        .map((item) => {
            const row = $(item);
            const title = $(item).find('.title > a');
            const magnet = $(item).find('td:nth-child(4) .download-pp').attr('href').substr(-60);
            const pubDate = parseDate($(item).find('td:nth-child(1) > span').text());
            const month = pubDate.getMonth() + 1;
            return {
                title: title.text().trim(),
                link: `${baseUrl}${title.attr('href')}`,
                guid: magnet,
                category: row.find('td:nth-child(2)').text().trim(),
                author: row.find('.title .tag').text().trim(),
                enclosure_url: `${dlUrl}/${pubDate.getFullYear()}/${month.toString().padStart(2, '0')}/${pubDate.getDate().toString().padStart(2, '0')}/${magnet.substr(-40)}.torrent`,
                enclosure_type: 'application/x-bittorrent',
                pubDate,
            };
        });

    let titleSuffix = '';
    if (team && items.length > 0) {
        titleSuffix += ` [${items[0].author}]`;
    }
    if (keyword) {
        titleSuffix += ` ${keyword}`;
    }
    if (titleSuffix !== '') {
        titleSuffix = ` -${titleSuffix}`;
    }
    ctx.state.data = {
        title: `動漫花園資源網${titleSuffix}`,
        link: pageUrl,
        description: '動漫花園資訊網是一個動漫愛好者交流的平台,提供最及時,最全面的動畫,漫畫,動漫音樂,動漫下載,BT,ED,動漫遊戲,資訊,分享,交流,讨论.',
        item: items,
        allowEmpty: true,
    };
};
