module.exports = function (router) {
  router.get('/team/:team/:keyword?', require('./search'));
  router.get('/:keyword?', require('./search'));
};
