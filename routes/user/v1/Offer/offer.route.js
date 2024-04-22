import express from 'express';
import validate from 'middlewares/validate';
import { offerController } from 'controllers/user';
import { offerValidation } from 'validations/user';
import auth from 'middlewares/auth';

const router = express();
/**
 * create offer
 * */
router.post('/create-offer', auth(), validate(offerValidation.createOffer), offerController.create);

/**
 * get-offer
 * */
router.get('/get-offer', auth(), validate(offerValidation.GetOffer), offerController.list);

module.exports = router;
