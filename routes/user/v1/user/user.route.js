import express from 'express';
import { userController } from 'controllers/user';
import { userValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createUser
   * */
  .post(validate(userValidation.createUser), userController.create)

  /**
   * deleteUserById
   * */
  .delete(auth(), validate(userValidation.deleteUser), userController.remove)
  /**
   * getUser
   * */
  .get(validate(userValidation.getUser), userController.list);
/**
 * getVendorUserList
 * */
router.get('/vendors', userController.getVendorUserList);
/**
 * getVendorByBusinessType
 * */
router.get(
  '/vendors/:businessType',
  validate(userValidation.getVendorByBusinessType),
  userController.getVendorByBusinessType
);
router
  .route('/update-user')
  /**
   * getUserPaginated
   * */
  .put(auth(), validate(userValidation.updateUserPrivacy), userController.updateUser);

router
  .route('/checkPlan')
  /**
   * getUserByUserUniqueId
   * */
  .get(auth(), userController.checkPlan);
router
  .route('/users-not-frd')
  /**
   * getUserPaginated
   * */
  .get(auth(), validate(userValidation.paginatedUserThatNotFriend), userController.paginatedUserThatNotFriend);

router
  .route('/paginated')
  /**
   * getUserPaginated
   * */
  .get(validate(userValidation.paginatedUser), userController.paginate);
router
  .route('/getStatusCount')
  /**
   * getUserCount
   * */
  .get(auth(), userController.getStats);
/**
 * getUserByGender
 * */
router.route('/getUserByGender').get(auth(), validate(userValidation.getUserByGender), userController.getUserByGender);
/**
 * getPrimeUserList
 * */
router.route('/getUserPrimeUser').get(auth(), validate(userValidation.getprimeuser), userController.getprimeuser);
/**
 * getNewUserList
 * */
router.route('/getNewUser').get(auth(), validate(userValidation.getnewuser), userController.getnewuser);

router
  .route('/getUserByGenderDating')
  .get(auth(), validate(userValidation.getUserByGenderDating), userController.getUserByGenderDating);

router
  .route('/getUserByGenderDatingAge')
  .post(
    auth(),
    validate(userValidation.getUserByGenderAndAgeAndMatchDating),
    userController.getUserByGenderAndAgeAndMatchDating
  );
router
  .route('/getUser-list-by-interest')
  .post(auth(), validate(userValidation.getFilteredDatingUsers), userController.getFilteredDatingUsers);

router.route('/search-user-dating').post(auth(), validate(userValidation.searchUser), userController.searchUser);

router.route('/pending-fields').get(auth(), userController.checkMissingFields);
/**
 * pending-fields-for-mobile
 * */
router.route('/pending-fields-for-mobile').get(auth(), userController.checkMissingFieldsMobile);
router
  .route('/:userId')
  /**
   * updateUser
   * */
  .put(auth(), validate(userValidation.updateUser), userController.update)
  /**
   * getUserById
   * */
  .get(auth(), validate(userValidation.getUserById), userController.get);
router.route('/get-dating-user/:userId').get(auth(), validate(userValidation.getMatchUser), userController.getDatingUser);

router.route('/get-match-user/:userId').get(auth(), validate(userValidation.getMatchUser), userController.getMatchUser);

router
  .route('/delete-profile-image/:userId')
  /**
   * updateUser
   * */
  .post(validate(userValidation.deleteUserImages), userController.deleteUserImage);
router
  .route('/userUniqueId/:userUniqueId')
  /**
   * getUserByUserUniqueId
   * */
  .get(auth(), validate(userValidation.get), userController.getUnique);
router
  .route('/get-credit/:userId')
  /**
   * getUserByUserUniqueId
   * */
  .get(auth(), validate(userValidation.getCredit), userController.getCreditByUserId);
router.delete('/delete-account', auth(), validate(userValidation.deleteUser), userController.deleteUserAccount);

export default router;
