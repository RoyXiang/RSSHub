module.exports = (router) => {
    router.get('/moe/latest', require('./moe/latest'));
    router.get('/moe/:tags/:name?', require('./moe/tags'));
};
