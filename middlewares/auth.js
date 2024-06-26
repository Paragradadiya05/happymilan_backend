import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { TokenExpiredError } from 'jsonwebtoken';
import { roleservice } from '../services';

const verifyCallback = (req, resolve, reject, role) => async (err, user, info) => {
  if (err || info || !user) {
    if (info instanceof TokenExpiredError) {
      // This state that token is Invalid and we can send status code 498 so that user can call the refresh token if we have any
      return reject(new ApiError(httpStatus.extra.unofficial.INVALID_TOKEN, 'Token Expired'));
    }
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;

  if (role) {
    const getRole = await roleservice.getOneRole({
      _id: req.user.role,
    });
    if (typeof role === 'object') {
      if (!role.includes(getRole.role)) {
        reject(new ApiError(httpStatus.UNAUTHORIZED, 'You does not have permission to access this route!'));
      }
    } else if (typeof role === 'string') {
      if (getRole.role !== role) {
        reject(new ApiError(httpStatus.UNAUTHORIZED, 'You does not have permission to access this route!'));
      }
    }
  }
  resolve();
};
const auth = (role) => async (req, res, next) => {
  return new Promise((resolve, reject) => {
    // Extract token from Authorization header or query parameters
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : req.query.authToken;
    if (token) {
      // Set the token in the headers for Passport to use
      req.headers.authorization = `Bearer ${token}`;
    }
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, role))(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};
module.exports = auth;
