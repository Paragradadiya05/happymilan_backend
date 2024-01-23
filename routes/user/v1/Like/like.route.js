import express from 'express';
import validate from 'middlewares/validate';
import { likeController } from 'controllers/user';
import { likeValidation } from 'validations/user';
import auth from 'middlewares/auth';

const router = express();
/**
 * create like
 * */
router.post('/create-like', auth(), validate(likeValidation.createLike), likeController.createlike);
/**
 * getlikes
 * */
router.get('/getlike/:userId', auth(), validate(likeValidation.GetLikes), likeController.getlike);

/**
 * deletelike
 * */
router.delete('/delete-like/:likeId', validate(likeValidation.DeleteLike), likeController.remove);

module.exports = router;
