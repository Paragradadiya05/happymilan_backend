const EnumCodeTypeOfCode = {
  RESETPASSWORD: 'resetPassword',
  LOGIN: 'login',
};
const EnumRoleOfUser = {
  USER: 'user',
  ADMIN: 'admin',
};
const EnumPlatformOfDeviceToken = {
  ANDROID: 'android',
  IOS: 'ios',
  WEB: 'web',
};
const EnumTypeOfToken = {
  RESET_PASSWORD: 'resetPassword',
  VERIFY_EMAIL: 'verifyEmail',
  REFRESH: 'refresh',
};
const EnumAppUsesTypeOfUsers = {
  MARRIAGE: 'marriage',
  DATING: 'dating',
};
const EnumGenderOfUsers = {
  MALE: 'male',
  FEMALE: 'female',
};
const EnumStatusOfFriend = {
  REQUESTED: 'requested',
  RECEIVED: 'received',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  REMOVED: 'removed',
  BLOCKED: 'blocked',
};

const EnumCreatingProfileFor = {
  MY_SELF: 'mySelf',
  MY_SON: 'mySon',
  MY_DAUGHTER: 'myDaughter',
  MY_BROTHER: 'myBrother',
  MY_FRIEND: 'myFriend',
};
module.exports = {
  EnumCodeTypeOfCode,
  EnumRoleOfUser,
  EnumPlatformOfDeviceToken,
  EnumTypeOfToken,
  EnumAppUsesTypeOfUsers,
  EnumGenderOfUsers,
  EnumStatusOfFriend,
  EnumCreatingProfileFor,
};
