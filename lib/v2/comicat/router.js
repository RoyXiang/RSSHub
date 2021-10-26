module.exports = (router) => {
    router.get('/:keyword?', require('./keyword'));
};
