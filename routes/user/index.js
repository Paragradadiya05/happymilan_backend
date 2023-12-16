import express from 'express';
import userRoutes from './v1/user/user.route';
import testRoutes from './v1/test/test.route';
import authRoutes from './v1/auth/auth.route';
import addressRoutes from './v1/address/addresh.route';
import userProfessionalDetailRoutes from './v1/userProfationalDetail/userProfationalDetail.route';
import friendRoutes from './v1/friend/friend.route';
import storyRoute from './v1/story/story.route';
import blogRoute from './v1/blog/blog.route';
import ShortlistRoute from './v1/shortlist/shortlist.route';
import profileviwerRoute from './v1/profilrviewer/profileviwer.route';

const router = express.Router();
router.use('/user', userRoutes);
router.use('/test', testRoutes);
router.use('/auth', authRoutes);
router.use('/address', addressRoutes);
router.use('/userProfessionalDetail', userProfessionalDetailRoutes);
router.use('/friend', friendRoutes);
router.use('/story', storyRoute);
router.use('/blog', blogRoute);
router.use('/shortlist', ShortlistRoute);
// todo : correct this speling profileviwerRoute
router.use('/profile-viewer', profileviwerRoute);

// router.use('/userEducation', userEducationRoutes);
// router.use('/commentOnStory', commentOnStoryRoutes);
// router.use('/commentsOnBlog', commentsOnBlogRoutes);
// router.use('/notification', notificationRoutes);

module.exports = router;
