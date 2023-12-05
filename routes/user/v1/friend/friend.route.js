import express from 'express';
import { friendController } from 'controllers/user';
import { friendValidation } from 'validations/user';
import validate from 'middlewares/validate';

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
router
  .route('/paginated')
  /**
   * getFriendPaginated
   * */
  .get(validate(friendValidation.paginatedFriend), friendController.paginateFriend);
router
    .route('/respond-friend-req')
    /**
     * acceptfriendreq
     * */
    .post(validate(friendValidation.respondFriendRequest), friendController.respondFriendRequest)
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
