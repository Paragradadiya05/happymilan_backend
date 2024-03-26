import express from 'express';
import validate from 'middlewares/validate';
import { likeController } from 'controllers/user';
import { likeValidation } from 'validations/user';
import auth from 'middlewares/auth';

const router = express();
/**
 * create like
 * */
router.post('/create-like', auth(), validate(likeValidation.createLike), likeController.createLike);

/**
 * getlikes
 * */
router.get('/getlike/:userId', auth(), validate(likeValidation.GetLikes), likeController.getLike);
/**
 * getlikeduser
 * */
router.get('/get-like/:likedUserId', auth(), validate(likeValidation.likeData), likeController.likeData);
/**
 * UpdateLike
 * */
router.put('/update-like/:likeId', auth(), validate(likeValidation.updateLike), likeController.updateLike);
/**
 * deletelike
 * */
router.delete('/delete-like/:likeId', validate(likeValidation.DeleteLike), likeController.remove);

module.exports = router;
