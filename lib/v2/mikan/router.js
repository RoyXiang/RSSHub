module.exports = (router) => {
    router.get('/user/:token', require('./user'));
};
