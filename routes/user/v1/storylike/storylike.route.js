import express from 'express';
import validate from 'middlewares/validate';
import { StoryLikeController } from 'controllers/user';
import { StoryLikeValidation } from 'validations/user';
import auth from 'middlewares/auth';

const router = express();
/**
 * create like
 * */
router.post('/create-like', auth(), validate(StoryLikeValidation.createLike), StoryLikeController.createLike);

/**
 * get-likes
 * */
router.get(
  '/getlike/:userId',
  auth(),
  validate(StoryLikeValidation.paginatedStatus),
  StoryLikeController.userPaginateStatus
);
/**
 * get-liked-user
 * */
router.get('/get-like/:storyId', auth(), validate(StoryLikeValidation.likeData), StoryLikeController.likeData);
/**
 * get-liked-user
 * */
router.get('/get-like-story/:storyId', auth(), validate(StoryLikeValidation.likeData), StoryLikeController.StorylikeData);
/**
 * UpdateLike
 * */
router.put('/update-like/:likeId', auth(), validate(StoryLikeValidation.updateLike), StoryLikeController.updateLike);
/**
 * delete-like
 * */
router.delete('/delete-like/:likeId', validate(StoryLikeValidation.DeleteLike), StoryLikeController.remove);
/**
 * getLikePaginated
 * */
router.get(
  '/get-user-likes-paginated/:userId',
  auth(),
  validate(StoryLikeValidation.paginatedStatus),
  StoryLikeController.paginateStatus
);
router.get(
  '/get-likes-paginated/:storyId',
  auth(),
  validate(StoryLikeValidation.PaginateStory),
  StoryLikeController.PaginateStory
);
module.exports = router;
