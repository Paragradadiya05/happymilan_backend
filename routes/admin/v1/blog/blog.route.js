import express from 'express';
import { blogValidation } from 'validations/admin';
import { blogController } from 'controllers/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
/**
 * create blog
 * */
router.post(
  '/create-blog',
  // auth(['admin']),
  validate(blogValidation.createBlog),
  blogController.create
);
/**
 * get blog
 * */
router.get('/get-blog', validate(blogValidation.getBlog), blogController.list);
/**
 * get blog byid
 * */
router.get(
  '/get-blog/:blogId',
  // auth(['admin']),
  validate(blogValidation.getBlogbyId),
  blogController.getBlogbyId
);
/**
 * update blog
 * */
router.put('/update-blog/:blogId', auth(['admin']), validate(blogValidation.updateBlog), blogController.update);
/**
 * deleteblogById
 * */
router.delete('/delete-blog/:blogId', auth(['admin']), validate(blogValidation.deleteBlogById), blogController.remove);

export default router;
