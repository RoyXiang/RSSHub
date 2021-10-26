module.exports = (router) => {
    router.get('/bookmarked', require('./bookmarked'));
    router.get('/:keyword?', require('./keyword'));
};
