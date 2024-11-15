import express from 'express';
import { SuccessStoryViewController } from 'controllers/user';
import { SuccessStoryviewValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/create-view')
  /**
   * createFriend
   * */
  .post(auth(), validate(SuccessStoryviewValidation.createview), SuccessStoryViewController.createView)
  /**
   * getFriend
   * */
  .get(auth(), SuccessStoryViewController.list);
router
  .route('/paginated/:storyId')
  /**
   * getFriendPaginated
   * */
  .get(validate(SuccessStoryviewValidation.paginated), SuccessStoryViewController.Paginated);
export default router;
