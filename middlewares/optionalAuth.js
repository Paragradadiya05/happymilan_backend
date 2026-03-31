import jwt from 'jsonwebtoken';
import config from '../config/config';
import User from '../models/user.model';

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    const payload = jwt.verify(token, config.jwt.secret);

    const user = await User.findById(payload.sub);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    next(); // ignore token error
  }
};

export default optionalAuth;
