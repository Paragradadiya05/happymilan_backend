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
  .post(auth(), validate(friendValidation.createFriend), friendController.createFriend)
  /**
   * getFriend
   * */
  .get(auth(), validate(friendValidation.getFriend), friendController.listFriend);

router.get('/get-frd-requests', auth(), friendController.getRequests);

router.get('/get-frds', auth(), friendController.getMyFrdRequests);

router.get('/get-frd-mobile', auth(), friendController.getMyFrdRequestsMobile);

router.get('/get-rejected-frds', auth(), friendController.getRejectedFrdRequests);

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
  .post(auth(), validate(friendValidation.respondFriendRequest), friendController.respondFriendRequest);
router
  .route('/:friendId')
  /**
   * getFriendById
   * */
  .get(auth(), validate(friendValidation.getFriendById), friendController.getFriend)
  /**
   * updateFriend
   * */
  .put(auth(), validate(friendValidation.updateFriend), friendController.updateFriend)
  /**
   * deleteFriendById
   * */
  .delete(auth(), validate(friendValidation.deleteFriendById), friendController.removeFriend);
export default router;
