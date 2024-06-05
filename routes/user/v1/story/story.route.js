import express from 'express';
import { storyValidation } from 'validations/user';
import { storyController } from 'controllers/user';
import validate from 'middlewares/validate';
import auth from '../../../../middlewares/auth';

const router = express.Router();
/**
 * create story
 * */
router.post('/create-story', auth(), validate(storyValidation.createStory), storyController.create);
/**
 * get story
 * */
router.get('/get-story', validate(storyValidation.getStory), storyController.list);
/**
 * update story
 * */
router.put('/update-story/:storyId', validate(storyValidation.updateStory), storyController.update);
/**
 * deleteTestById
 * */
router.delete('/delete-story/:storyId', validate(storyValidation.deleteStoryById), storyController.remove);

export default router;
