import express from 'express';
import { friendController } from 'controllers/user';
import { friendValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/create-friend')
  /**
   * createFriend
   * */
  .post(validate(friendValidation.createFriend), friendController.createFriend)
  /**
   * getFriend
   * */
  .get(validate(friendValidation.getFriend), friendController.listFriend);

router.get('/get-frd-requests', auth(), friendController.getReuests);

router.get('/get-block-list', auth(), friendController.getBlockList);

router.get('/get-request-sent', auth(), friendController.getRequestedFriend);

router
  .route('/paginated')
  /**
   * getFriendPaginated
   * */
  .get(validate(friendValidation.paginatedFriend), friendController.paginateFriend);
router
  .route('/respond-friend-req')
  /**
   * accept friend req
   * */
  .post(validate(friendValidation.respondFriendRequest), friendController.respondFriendRequest);
router
  .route('/:friendId')
  /**
   * getFriendById
   * */
  .get(validate(friendValidation.getFriendById), friendController.getFriend)
  /**
   * updateFriend
   * */
  .put(validate(friendValidation.updateFriend), friendController.updateFriend)
  /**
   * deleteFriendById
   * */
  .delete(validate(friendValidation.deleteFriendById), friendController.removeFriend);
export default router;
