import express from 'express';
import { blogvalidation } from 'validations/user';
import { blogController } from 'controllers/user';
import validate from 'middlewares/validate';

const router = express.Router();
/**
 * create blog
 * */
router.post('/create-blog', validate(blogvalidation.createBlog), blogController.create);
/**
 * get blog
 * */
router.get('/get-blog', validate(blogvalidation.getBlog), blogController.list);

/**
 * update blog
 * */
router.put('/update-blog/:blogId', validate(blogvalidation.updateBlog), blogController.update);
/**
 * deleteblogById
 * */
router.delete('/delete-blog/:blogId', validate(blogvalidation.deleteBlogById), blogController.remove);

export default router;
