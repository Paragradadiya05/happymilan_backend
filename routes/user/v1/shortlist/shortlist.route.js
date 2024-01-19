import express from 'express';
import validate from 'middlewares/validate';
import { shortlistController } from 'controllers/user';
import { shortlistValidation } from 'validations/user';
import auth from 'middlewares/auth';

const router = express();
router.post('/create-shortlist', auth(), validate(shortlistValidation.createShortlist), shortlistController.createShortlist);

router.get('/get-short-list', auth(), validate(shortlistValidation.Getshortlist), shortlistController.getshortlist);
module.exports = router;
