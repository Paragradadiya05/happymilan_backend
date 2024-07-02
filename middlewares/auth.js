import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { TokenExpiredError } from 'jsonwebtoken';
import { roleservice } from '../services';

const verifyCallback = (req, resolve, reject, roles) => async (err, user, info) => {
  if (err || info || !user) {
    if (info instanceof TokenExpiredError) {
      // This state that token is Invalid and we can send status code 498 so that user can call the refresh token if we have any
      return reject(new ApiError(httpStatus.extra.unofficial.INVALID_TOKEN, 'Token Expired'));
    }
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;

  if (roles) {
    const getRole = await roleservice.getOneRole({
      _id: req.user.role,
    });
    if (typeof role === 'object') {
      if (!roles.includes(getRole.role)) {
        reject(new ApiError(httpStatus.UNAUTHORIZED, 'You does not have permission to access this route!'));
      }
    } else if (typeof roles === 'string') {
      if (getRole.role !== roles) {
        reject(new ApiError(httpStatus.UNAUTHORIZED, 'You does not have permission to access this route!'));
      }
    }
  }
  resolve();
};

// todo : updates roles based on data base roles update in middleware( params for middleware fun is coming dynamically in some admin routs so admin can access route based on that )
const auth = (roles) => async (req, res, next) => {
  return new Promise((resolve, reject) => {
    // Extract token from Authorization header or query parameters
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : req.query.authToken;
    if (token) {
      // Set the token in the headers for Passport to use
      req.headers.authorization = `Bearer ${token}`;
    }
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, roles))(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};
module.exports = auth;
