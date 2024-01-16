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

const EnumOfPlan = {
  FREE: 'free',
  PAID: 'paid',
  SILVER: 'silver',
  PREMIUM: 'premium',
};
const EnumOfOnlineSupport = {
  YES: 'yes',
  No: 'no',
};
const EnumOfPlanDuration = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  QUARTERLY: 'quarterly',
  BIANNUAL: 'biannual',
};
const EnumOfStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
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
  EnumOfStatus,
  EnumOfPlanDuration,
  EnumOfOnlineSupport,
  EnumOfPlan,
};
