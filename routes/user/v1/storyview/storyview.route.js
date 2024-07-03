import express from 'express';
import { storyViewController } from 'controllers/user';
import { storyViewValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/create-view')
  /**
   * createFriend
   * */
  .post(auth(), validate(storyViewValidation.createview), storyViewController.createView)
  /**
   * getFriend
   * */
  .get(auth(), storyViewController.list);
router
  .route('/paginated')
  /**
   * getFriendPaginated
   * */
  .get(validate(storyViewValidation.paginated), storyViewController.Paginated);
export default router;
