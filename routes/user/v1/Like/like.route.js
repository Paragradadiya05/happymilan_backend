import express from 'express';
import validate from 'middlewares/validate';
import { likeController } from 'controllers/user';
import { likeValidation } from 'validations/user';
import auth from 'middlewares/auth';
import appUserType from 'middlewares/appUserType';

const router = express();
/**
 * create like
 * */
router.post('/create-like', auth(), appUserType(), validate(likeValidation.createLike), likeController.createLike);

/**
 * get-likes
 * */
router.get(
  '/getlike/:userId',
  auth(),
  appUserType(),
  validate(likeValidation.paginatedStatus),
  likeController.userPaginateStatus
);
/**
 * get-liked-user
 * */
router.get('/get-like/:likedUserId', auth(), appUserType(), validate(likeValidation.likeData), likeController.likeData);
/**
 * UpdateLike
 * */
router.put('/update-like/:likeId', auth(), appUserType(), validate(likeValidation.updateLike), likeController.updateLike);
/**
 * delete-like
 * */
router.delete('/delete-like/:likeId', appUserType(), validate(likeValidation.DeleteLike), likeController.remove);
/**
 * getLikePaginated
 * */
router.get(
  '/get-user-likes-paginated/:userId',
  auth(),
  appUserType(),
  validate(likeValidation.paginatedStatus),
  likeController.paginateStatus
);
module.exports = router;
