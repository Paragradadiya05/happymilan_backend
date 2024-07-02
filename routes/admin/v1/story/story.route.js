import express from 'express';
import { storyValidation } from 'validations/admin';
import { storyController } from 'controllers/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
/**
 * create story
 * */
router.post('/create-story', auth(['admin']), validate(storyValidation.createStory), storyController.create);
/**
 * get storu
 * */
router.get('/get-story', auth(['admin']), validate(storyValidation.getStory), storyController.list);
/**
 * update story
 * */
router.put('/update-story/:storyId', auth(['admin']), validate(storyValidation.updateStory), storyController.update);
/**
 * deleteTestById
 * */
router.delete('/delete-story/:storyId', auth(['admin']), validate(storyValidation.deleteStoryById), storyController.remove);

export default router;
