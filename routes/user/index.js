import express from 'express';
import userRoutes from './v1/user/user.route';
import testRoutes from './v1/test/test.route';
import authRoutes from './v1/auth/auth.route';
import addressRoutes from './v1/address/addresh.route';
import userProfessionalDetailRoutes from './v1/userProfationalDetail/userProfationalDetail.route';
import friendRoutes from './v1/friend/friend.route';
import storyRoute from './v1/story/story.route';

const router = express.Router();
router.use('/user', userRoutes);
router.use('/test', testRoutes);
router.use('/auth', authRoutes);
router.use('/address', addressRoutes);
router.use('/userProfessionalDetail', userProfessionalDetailRoutes);
router.use('/friend', friendRoutes);
router.use('/story', storyRoute);
// router.use('/users', usersRoutes);
// router.use('/addresh', addreshRoutes);
// router.use('/userEducation', userEducationRoutes);
// router.use('/blog', blogRoutes);
// router.use('/story', storyRoutes);
// router.use('/commentOnStory', commentOnStoryRoutes);
// router.use('/commentsOnBlog', commentsOnBlogRoutes);
// router.use('/notification', notificationRoutes);
// router.use('/friend', friendRoutes);

module.exports = router;
