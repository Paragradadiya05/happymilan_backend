import express from 'express';
import { friendController } from 'controllers/user';
import { friendValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';
import appUserType from 'middlewares/appUserType';

const router = express.Router();
router
  .route('/create-friend')
  /**
   * createFriend
   * */
  .post(auth(), appUserType(), validate(friendValidation.createFriend), friendController.createFriend)
  /**
   * getFriend
   * */
  .get(auth(), validate(friendValidation.getFriend), friendController.listFriend);

router.get(
  '/get-frd-requests',
  auth(),
  appUserType(),
  validate(friendValidation.appUsesTypeValidation),
  friendController.getRequests
);

router.get(
  '/get-frds',
  auth(),
  appUserType(),
  validate(friendValidation.appUsesTypeValidation),
  friendController.getMyFrdRequests
);

router.get(
  '/get-frd-mobile',
  auth(),
  appUserType(),
  validate(friendValidation.getMyFrdRequestsMobile),
  friendController.getMyFrdRequestsMobile
);

router.get(
  '/get-rejected-frds',
  auth(),
  appUserType(),
  validate(friendValidation.appUsesTypeValidation),
  friendController.getRejectedFrdRequests
);

router.get(
  '/get-rejected-frdsv2',
  auth(),
  appUserType(),
  validate(friendValidation.appUsesTypeValidation),
  friendController.getRejectedFrdRequestsv2
);

router.get(
  '/get-block-list',
  auth(),
  appUserType(),
  validate(friendValidation.appUsesTypeValidation),
  friendController.getBlockList
);

router.get(
  '/get-block-listv2',
  auth(),
  appUserType(),
  validate(friendValidation.appUsesTypeValidation),
  friendController.getBlockListv2
);

router.get(
  '/get-request-sent',
  auth(),
  appUserType(),
  validate(friendValidation.appUsesTypeValidation),
  friendController.getRequestedFriend
);

router.get(
  '/get-request-sentv2',
  auth(),
  appUserType(),
  validate(friendValidation.getRequestedFriendv2),
  friendController.getRequestedFriendv2
);

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
  .post(auth(), appUserType(), validate(friendValidation.respondFriendRequest), friendController.respondFriendRequest);
router
  .route('/:friendId')
  /**
   * getFriendById
   * */
  .get(auth(), appUserType(), validate(friendValidation.getFriendById), friendController.getFriend)
  /**
   * updateFriend
   * */
  .put(auth(), appUserType(), validate(friendValidation.updateFriend), friendController.updateFriend)
  /**
   * deleteFriendById
   * */
  .delete(auth(), appUserType(), validate(friendValidation.deleteFriendById), friendController.removeFriend);
export default router;
