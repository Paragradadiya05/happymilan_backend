import express from 'express';
import { storyValidation } from 'validations/user';
import { storyController } from 'controllers/user';
import validate from 'middlewares/validate';

const router = express.Router();
/**
 * create story
 * */
router.post('/create-story', validate(storyValidation.createStory), storyController.create);
/**
 * get storu
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
