const appUserType = () => (req, res, next) => {
  return new Promise((resolve) => {
    if (!req.query.appUsesType) {
      req.query.appUsesType = 'marriage';
    }
    resolve();
  })
    .then(() => next())
    .catch((err) => next(err));
};
module.exports = appUserType;
