import express from 'express';
import validate from 'middlewares/validate';
import { shortlistController } from 'controllers/user';
import { shortlistValidation } from 'validations/user';
import auth from 'middlewares/auth';

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
  '/delete-short-list/:userId',
  auth(),
  validate(shortlistValidation.deleteShortlistByUser),
  shortlistController.deleteShortlistByUser
);
module.exports = router;
