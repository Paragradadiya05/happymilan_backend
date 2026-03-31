import express from 'express';
import validate from 'middlewares/validate';
import { shortlistController } from 'controllers/user';
import { shortlistValidation } from 'validations/user';
import auth from 'middlewares/auth';
import appUserType from 'middlewares/appUserType';

const router = express();
router.post('/create-shortlist', auth(), validate(shortlistValidation.createShortlist), shortlistController.createShortlist);

router.get('/get-short-list', auth(), validate(shortlistValidation.GetShortlist), shortlistController.getshortlist);

router.get(
  '/get-short-list/:userId',
  auth(),
  validate(shortlistValidation.GetShortlistByUser),
  shortlistController.getShortlistByUser
);
router.delete(
  '/delete-short-list/:id',
  auth(),
  validate(shortlistValidation.deleteShortlistByUser),
  shortlistController.deleteShortlistByUser
);
router.get(
  '/get-short-list-paginat/:userId',
  auth(),
  appUserType(),
  validate(shortlistValidation.GetShortlistByUser),
  shortlistController.getShortlistPagination
);
router.get(
  '/get-short-list-mobile/:userId',
  auth(),
  appUserType(),
  validate(shortlistValidation.GetShortlistByUser),
  shortlistController.getShortlistMobile
);
router.get(
  '/get-short-list-vendor/:userId',
  auth(),
  validate(shortlistValidation.getVendorShortlistValidation),
  shortlistController.getVendorShortlistByUser
);
module.exports = router;
