import httpStatus from 'http-status';
import { ProfileView, User, Notification } from '../models';
import ApiError from '../utils/ApiError';

export async function createprofileviewer(body = {}, user) {
  const userId = user._id;
  const { viewerId } = body;

  const viewer = await User.findOne({ _id: viewerId });
  if (!viewer) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such user exists');
  }

  let existingProfileView = await ProfileView.findOne({ user: userId, viewerId });

  if (existingProfileView) {
    existingProfileView.lastViewTime = Date.now();

    if (!existingProfileView.recentViews) {
      existingProfileView.recentViews = [];
    }
    existingProfileView.recentViews.push({ recentView: Date.now() });

    existingProfileView = await existingProfileView.save();

    return existingProfileView;
  }
  await Notification.create({ userId, otherUserId: body.viewerId, body: 'view your profile' });
  return ProfileView.create({
    user: userId,
    viewerId: body.viewerId,
    createdBy: user,
    updatedBy: user,
    recentViews: [{ recentView: Date.now() }],
    lastViewTime: Date.now(),
  });
}
export async function getProfileViewer(filter, options = {}) {
  const user = await ProfileView.find(filter, options.projection, options).populate('user').populate('viewerId');
  return user;
}

export async function getProfileViewertWithPagination(filter, options = {}) {
  const user = await ProfileView.paginate(filter, options);
  return user;
}
