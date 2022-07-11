module.exports = (router) => {
    router.get('/user/:user', require('./user'));
    router.get('/search/:query?', require('./search'));
    router.get('/sukebei/search/:query?', require('./search'));
};
