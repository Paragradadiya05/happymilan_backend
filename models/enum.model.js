const EnumCodeTypeOfCode = {
  RESETPASSWORD: 'resetPassword',
  LOGIN: 'login',
  RESET_LOGIN_CRED: 'resetLoginCred',
};
const EnumRoleOfUser = {
  USER: 'user',
  ADMIN: 'admin',
  PROJECT_OWNER: 'project-owner',
  SUPER_ADMIN: 'super-admin',
  CO_ADMIN: 'co-admin',
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
  STORY_CONSENT: 'story_consent',
};
const EnumAppUsesTypeOfUsers = {
  MARRIAGE: 'marriage',
  DATING: 'dating',
  SOCIAL: 'social',
  ALL: 'all',
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
  GOLD: 'gold',
  PLATINUM: 'Platinum',
  SILVER: 'silver',
};
const EnumOfOnlineSupport = {
  YES: 'yes',
  No: 'no',
};
const EnumOfPlanDuration = {
  MONTHLY: 'monthly',
  TWO_MONTHLY: 'two-month',
  THREE_MONTHLY: 'three-month',
  YEARLY: 'yearly',
  QUARTERLY: 'quarterly',
  BIANNUAL: 'biannual',
};
const EnumOfStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};
const EnumOfMaritalStatus = {
  SINGLE: 'single',
  NEVER_MARRIED: 'never-married',
  MARRIED: 'married',
};
const EnumOfReligion = {
  HINDU: 'hindu',
  MUSLIM: 'muslim',
  SIKH: 'sikh',
};
const EnumOfCommunity = {
  PATEL: 'patel',
  SHAH: 'shah',
  SONI: 'soni',
};
const EnumOfMotherTongue = {
  GUJARATI: 'gujarati',
  HINDI: 'hindi',
  ENGLISH: 'english',
};
const EnumOflanguage = {
  GUJARATI: 'gujarati',
  HINDI: 'hindi',
  ENGLISH: 'english',
};
const EnumOfManglikStatus = {
  YES: 'yes',
  No: 'no',
};
const EnumOfCurrentCountry = {
  INDIA: 'india',
  CANADA: 'canada',
  US: 'us',
  AFGHANISTAN: 'afghanistan',
  CHINA: 'china',
  MYANMAR: 'Myanmar',
  NEPAL: 'nepal',
  SRI_LANKA: 'sri-Lanka',
  PAKISTAN: 'pakistan',
};
const EnumOfState = {
  GUJARAT: 'gujarat',
  ASSAM: 'assam',
  ANDHRA_PRADESH: 'andhra-pradesh',
  ARUNACHAL_PRADESH: 'arunachal-pradesh',
  BIHAR: 'bihar',
  CHHATTISGARH: 'chhattisgarh',
  GOA: 'goa',
  HARYANA: 'haryana',
  HIMACHAL_PRADESH: 'himachal-pradesh',
  JHARKHAND: 'jharkhand',
  KARNATAKA: 'karnataka',
  KERALA: 'kerala',
  MADHYA_PRADESH: 'madhya-pradesh',
  MAHARASHTRA: 'maharashtra',
  MANIPUR: 'manipur',
  MEGHALAYA: 'meghalaya',
  MIZORAM: 'mizoram',
  NAGALAND: 'nagaland',
  ODISHA: 'odisha',
  PUNJAB: 'punjab',
  RAJASTHAN: 'rajasthan',
  SIKKIM: 'sikkim',
  TAMIL_NADU: 'tamil-nadu',
  TELANGANA: 'telangana',
  UTTAR_PRADESH: 'uttar-pradesh',
  UTTARAKHAND: 'uttarakhand',
  WEST_BENGAL: 'west-bengal',
  ALBERTA: 'alberta',
  BRITISH_COLUMBIA: 'british-columbia',
  MANITOBA: 'manitoba',
  NEW_BRUNSWICK: 'new-brunswick',
  NEWFOUND_LAND: 'newfound-land',
  NOVA_SCOTIA: 'nova-scotia',
  ONTARIO: 'ontario',
  PRINCE_EDWARD_ISLAND: 'prince-edward-island',
  QUEBEC: 'quebec',
  SASKATCHEWAN: 'saskatchewan',
  ALABAMA: 'alabama',
  ALASKA: 'alaska',
  ARIZONA: 'arizona',
  ARKANSAS: 'arkansas',
  CALIFORNIA: 'california',
  COLORADO: 'colorado',
  CONNECTICUT: 'connecticut',
  DELAWARE: 'delaware',
  FLORIDA: 'florida',
  GEORGIA: 'georgia',
  HAWAII: 'hawaii',
  IDAHO: 'idaho',
  ILLINOIS: 'illinois',
};

const EnumOfCountry = {
  INDIA: 'india',
  AUSTRALIA: 'australia',
  CANADA: 'canada',
  US: 'us',
  UAE: 'uae',
  JAPAN: 'japan',
  SINGAPORE: 'singapore',
  FRANCE: 'france',
  UNITED_KINGDOM: 'united-kingdom',
  AFGHANISTAN: 'afghanistan',
  CHINA: 'china',
  MYANMAR: 'myanmar',
  NEPAL: 'nepal',
  SRI_LANKA: 'sri-lanka',
  PAKISTAN: 'pakistan',
};

const EnumOfCreative = {
  WRITING: 'writing',
  PAINTING: 'painting',
};
const EnumOfDiet = {
  VEGETARIAN: 'vegetarian',
  NON_VEGETARIAN: 'non_vegetarian',
};

const EnumOfPrivacySetting = {
  PRIVATE_PROFILE: 'privateProfile',
  PREMIUM_PROFILE: 'premiumProfile',
  ONLY_ACCEPTED_MEMBERS: 'onlyAcceptedMembers',
  DEFAULT: 'default',
  PUBLIC_PROFILE: 'publicProfile',
};

const EnumForTimeDurationOfProfileHide = {
  ONE_WEEK: 'oneWeek',
  TWO_WEEK: 'twoWeek',
  ONE_MONTH: 'oneMonth',
  THREE_MONTH: 'threeMonth',
  SIX_MONTH: 'sixMonth',
};
const EnumOfReasonForProfileDelete = {
  FOUND_SUITABLE_PARTNER: 'found-suitable-partner',
  MARRIED_OR_ENGAGED: 'married-or-engaged',
  TAKING_BREAK: 'taking-break',
  PRIVACY_OR_SAFETY_CONCERNS: 'privacy-or-safety-concerns',
  DIFFICULT_TO_USE: 'difficult-to-use',
  TOO_MANY_UNRELATED_MATCHES: 'too-many-unrelated-matches',
  DID_NOT_GET_EXPECTED_RESPONSES: 'did-not-get-expected-responses',
  TOO_COSTLY_OR_NOT_VALUABLE: 'too-costly-or-not-valuable',
  OTHER: 'other',
};

const EnumOfImageTypes = {
  PROFILE_IMAGE: 'profileImage',
  STATUS_IMAGE: 'statusImage',
  PROFILE_VIDEO: 'profileVideo',
};
const EnumOfNotification = {
  REQUEST_SENT: 'Request-sent',
  REQUEST_DECLINED: 'Declined your request',
  REQUEST_RECEIVED: 'Sent you a request',
  REQUEST_ACCEPTED: 'accepted your request',
  LIKE: 'like',
  SOMEONE_LIKED_YOUR_PROFILE: 'likes you',
  OTP_SEND: 'otp has been sent to your registered email',
  RESET_PASS: 'link has been sent to your registered email',
  CONGRATULATION:
    'Welcome to HappyMilan! We are thrilled to have you as a part of our community. Congratulations on successfully registering your account.',
};
const EnumOfChatType = {
  IMAGE: 'image',
  DOC: 'doc',
  LINK: 'link',
  REPLY: 'reply',
  TEXT: 'text',
  VIDEO: 'video',
  AUDIO: 'audio',
};
const EnumOfOffer = {
  FESTIVAL: 'festival',
  OFFER: 'offer',
  PROMOTION: 'promotion',
};

const EnumOfUserPlan = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
};
const EnumOfGothra = {
  AGASTHI: 'Agasthi',
  ATRI: 'Atri',
  ANGIRASA: 'Angirasa',
  BHARADWAJ: 'Bharadwaj',
  GAUTAM: 'Gautam',
  JAMADAGNI: 'Jamadagni',
  KASHYAP: 'Kashyap',
  VASISHTA: 'Vasishta',
  VISHWAMITRA: 'Vishwamitra',
  BHRIGU: 'Bhrigu',
  SHANDILYA: 'Shandilya',
  KAUSHIK: 'Kaushik',
  PARASHAR: 'Parashar',
  VATSA: 'Vatsa',
  MUDGAL: 'Mudgal',
  OTHER: 'Other',
};

const EnumOfReason = {
  JUST_DONT_LIKE_IT: 'just-dont-like-it',
  ITS_SPAM: 'its-spam',
  NUDITY_OR_SEXUAL_ACTIVITY: 'nudity-or-sexual-activity',
  BULLYING_OR_HARASSMENT: 'bullying-or-harassment',
  SCAM_OR_FRAUD: 'scam-or-fraud',
};

// todo : add this enum in data base and handle from main admin panel
const EnumOfPlatformType = {
  HAPPY_MILAN: 'happyMilan',
  BUSINESS_PLATFORM: 'businessPlatform',
};
const EnumOfKyc = {
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving-license',
  AADHAR_CARD: 'aadhar-card',
  ELECTION_CARD: 'election-card',
  SELFIE: 'selfie',
};
const EnumOfInterest = {
  MEET_NEW_FRIENDS: 'meet-new-friends',
  LOOKING_FOR_LOVE: 'looking-for-love',
  MOVIE_DATE: 'movie-date',
  FOODIES: 'foodies',
  TRAVEL_BUDDIES: 'travel-buddies',
  GAME_LOVER: 'game-lover',
  CHITCHAT: 'chit-chat',
  ADVENTUROUS: 'adventurous',
};
const EnumOf2faMethod = {
  AUTHENTICATOR_APP: 'authenticator-app',
  OTP: 'otp',
};
const EnumOfZodiac = {
  ARIES: 'Aries',
  TAURUS: 'Taurus',
  GEMINI: 'Gemini',
  CANCER: 'Cancer',
  LEO: 'Leo',
  VIRGO: 'Virgo',
  LIBRA: 'Libra',
  SCORPIO: 'Scorpio',
  SAGITTARIUS: 'Sagittarius',
  CAPRICORN: 'Capricorn',
  AQUARIUS: 'Aquarius',
  PISCES: 'Pisces',
};

const EnumOfBlogType = {
  BLOGS: 'blogs',
  VIDEO: 'video',
  PHOTOS: 'photos',
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
  EnumOfMaritalStatus,
  EnumOfPlanDuration,
  EnumOfOnlineSupport,
  EnumOfPlan,
  EnumOfReligion,
  EnumOfCommunity,
  EnumOfMotherTongue,
  EnumOfCurrentCountry,
  EnumOfState,
  EnumOfCountry,
  EnumOfCreative,
  EnumOfDiet,
  EnumOfPrivacySetting,
  EnumForTimeDurationOfProfileHide,
  EnumOfReasonForProfileDelete,
  EnumOfImageTypes,
  EnumOfNotification,
  EnumOfChatType,
  EnumOfOffer,
  EnumOfUserPlan,
  EnumOfReason,
  EnumOfPlatformType,
  EnumOfKyc,
  EnumOfInterest,
  EnumOf2faMethod,
  EnumOfManglikStatus,
  EnumOfGothra,
  EnumOfZodiac,
  EnumOflanguage,
  EnumOfBlogType,
};
