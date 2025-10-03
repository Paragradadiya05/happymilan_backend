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
  NON_BINARY: 'nonBinary',
  PREFER_NOT_TO_SAY: 'preferNotToSay',
  OTHER: 'other',
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
  MY_RELATIVES: 'myRelatives',
  MY_COUSIN: 'myCousin',
  MY_NEPHEW: 'myNephew',
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
  NEVER_MARRIED: 'neverMarried',
  MARRIED: 'married',
  DIVORCEE: 'divorcee',
};

const EnumOfReligion = {
  HINDU: 'hindu',
  MUSLIM: 'muslim',
  CHRISTIAN: 'christian',
  SIKH: 'sikh',
  BUDDHIST: 'buddhist',
  JAIN: 'jain',
  ISLAM: 'islam',
  OTHER: 'other',
};

const EnumOfCommunity = {
  PATEL: 'patel',
  SHAH: 'shah',
  SONI: 'soni',
};
const EnumOfMotherTongue = {
  ASSAMESE: 'assamese',
  BENGALI: 'bengali',
  BODO: 'bodo',
  DOGRI: 'dogri',
  GUJARATI: 'gujarati',
  HINDI: 'hindi',
  KANNADA: 'kannada',
  KASHMIRI: 'kashmiri',
  KONKINI: 'konkini',
  MANIPURI: 'manipuri',
  MARATHI: 'marathi',
  NEPALI: 'nepali',
  ODIA: 'odia',
  PUNJABI: 'punjabi',
  SANSKRIT: 'sanskrit',
  SANTALI: 'santali',
  SINDHI: 'sindhi',
  TAMIL: 'tamil',
  TELUGU: 'telugu',
  URDU: 'urdu',
  ENGLISH: 'english',
};

const EnumOflanguage = {
  GUJARATI: 'gujarati',
  HINDI: 'hindi',
  ENGLISH: 'english',
};
const EnumOfManglikStatus = {
  MANGLIK: 'manglik',
  NON_MANGLIK: 'non-manglik',
  ANSHIK_MANGLIK: 'anshik-manglik',
  DONT_KNOW: 'dont-know',
};

const EnumOfCurrentCountry = {
  INDIA: 'india',
};
const EnumOfState = {
  ANDHRA_PRADESH: 'andhra-pradesh',
  ARUNACHAL_PRADESH: 'arunachal-pradesh',
  ASSAM: 'assam',
  BIHAR: 'bihar',
  CHHATTISGARH: 'chhattisgarh',
  GOA: 'goa',
  GUJARAT: 'gujarat',
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
  TRIPURA: 'tripura',
  UTTAR_PRADESH: 'uttar-pradesh',
  UTTARAKHAND: 'uttarakhand',
  WEST_BENGAL: 'west-bengal',
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
  EGGETARIAN: 'eggetarian',
  NON_VEGETARIAN: 'non_vegetarian',
  VEGAN: 'vegan',
  JAIN: 'jain',
  OCCASIONALLY_NON_VEGETARIAN: 'occasionally_non_vegetarian',
  OCCASIONALLY_VEGETARIAN: 'occasionally_vegetarian',
  SATVIK: 'satvik',
  OTHER: 'other',
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

const EnumOfHobby = {
  WRITING: 'writing',
  PLAY_INSTRUMENT: 'play_instrument',
  POETRY: 'poetry',
  COOKING: 'cooking',
  PAINTING: 'painting',
  GARDENING: 'gardening',
  SINGING: 'singing',
  DIY_CRAFTS: 'diy_crafts',
  BLOGGING: 'blogging',
  PHOTOGRAPHY: 'photography',
  DANCING: 'dancing',
  CONTENT_CREATION: 'content_creation',
  MOVIE: 'movie',
  SPORTS: 'sports',
  BIKING: 'biking',
  MUSIC: 'music',
  SOCIAL_MEDIA: 'social_media',
  CLUBBING: 'clubbing',
  TRAVELLING: 'travelling',
  GAMING: 'gaming',
  SHOPPING: 'shopping',
  READING: 'reading',
  BINGE_WATCHING: 'binge_watching',
  THEATER_EVENTS: 'theater_events',
  RUNNING: 'running',
  CYCLING: 'cycling',
  YOGA: 'yoga',
  WALKING: 'walking',
  WORKING_OUT: 'working_out',
  TREKKING: 'trekking',
  AEROBICS_ZUMBA: 'aerobics_zumba',
  SWIMMING: 'swimming',
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
  BHARADVAJA: 'Bharadvaja',
  KASHYAPA: 'Kashyapa',
  ATRI: 'Atri',
  VASHISTHA: 'Vashistha',
  VISHWAMITRA: 'Vishwamitra',
  GAUTAMA: 'Gautama',
  JAMADAGNI: 'Jamadagni',
  AGASTYA: 'Agastya',
  BHRIGU: 'Bhrigu',
  KAUSHIKA: 'Kaushika',
  SANDILYA: 'Sandilya',
  PARASHARA: 'Parashara',
  MANDAVYA: 'Mandavya',
  HARITA: 'Harita',
  KUTSA: 'Kutsa',
  SHRIVATSA: 'Shrivatsa',
  MUDGALA: 'Mudgala',
  VATSA: 'Vatsa',
  MAITREYA: 'Maitreya',
  DURVASA: 'Durvasa',
  CHYAVANA: 'Chyavana',
  MARICHI: 'Marichi',
  PULASTYA: 'Pulastya',
  PULAHA: 'Pulaha',
  KRATU: 'Kratu',
  ANGIRASA: 'Angirasa',
  VISHNUVARDHANA: 'Vishnuvardhana',
  SHUNAKA: 'Shunak',
  KAPILA: 'Kapila',
  VYASA: 'Vyasa',
  RISHYASHRINGA: 'Rishyashringa',
  SANKRITI: 'Sankriti',
  SAUNAKA: 'Saunaka',
  ROHINI: 'Rohini',
  LOMASHA: 'Lomasha',
  DEVALA: 'Devala',
  YAJNAVALKYA: 'Yajnavalkya',
  VALMIKI: 'Valmiki',
  GALAVA: 'Galava',
  VAMADEVA: 'Vamadeva',
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
const EnumOfCancelReason = {
  ACCIDENTAL_PURCHASE: 'accidental-purchase', // Accidental purchase / wrong plan selected
  CHANGED_MIND: 'changed-mind', // Changed mind before using premium features
  TECHNICAL_ISSUES: 'technical-issues', // Technical issues after upgrade
  OTHER: 'other', // Other reason
};
const EnumOfRefundStatus = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  NOT_APPLICABLE: 'not_applicable',
};
const EnumOfJobType = {
  GOVERNMENT: 'government',
  PRIVATE: 'private',
  RETIRED: 'retired',
  // STUDENT: 'student',
  // PREFER_NOT_TO_SAY: 'prefer_not_to_say',
  // NOT_WORKING: 'not_working',
  HOMEMAKER: 'homemaker',
};
const EnumOfDegree = {
  BACHELORS_ARTS: 'Bachelors Arts',
  BACHELORS_SCIENCE: 'Science',
  BACHELORS_COMMERCE: 'Commerce',
  B_PHIL: 'B Phil',
  BACHELORS_ENGINEERING: 'Bachelors Engineering',
  COMPUTERS: 'Computers',
  BCA: 'BCA',
  MCA: 'MCA',
  BBA: 'BBA',
  BSC: 'BSC',
  MSC: 'MSC',
  DIPLOMA: 'Diploma',
  HIGHER_SECONDARY: 'Higher Secondary',
  SECONDARY: 'Secondary',
  LEGAL_BL: 'Legal BL',
  ML: 'ML',
  LLB: 'LLB',
  LLM: 'LLM',
  MANAGEMENT_BBA: 'Management BBA',
  MBA: 'MBA',
  MASTERS_ARTS: 'Masters Arts',
  MASTERS_SCIENCE: 'Masters Science',
  MASTERS_COMMERCE: 'Masters Commerce',
  M_PHIL: 'M Phil',
  MASTERS_ENGINEERING: 'Masters Engineering',
  MASTERS_COMPUTERS: 'Computers (Masters)',
  MEDICINE_GENERAL: 'Medicine General',
  DENTAL: 'Dental',
  SURGEON: 'Surgeon',
  PHD: 'Ph.D',
  SERVICE_IAS: 'IAS',
  SERVICE_IPS: 'IPS',
  SERVICE_IRS: 'IRS',
  SERVICE_IES: 'IES',
  SERVICE_IFS: 'IF',
};
const EnumOfAdminRejectReason = {
  PREMIUM_FEATURES_UTILIZED: 'Premium features already utilized',
  OUTSIDE_REFUND_ELIGIBILITY: 'Request made outside refund eligibility period',
  ONGOING_COMMUNICATION: 'Ongoing communication with other members under current plan',
  CHARGEBACK_INITIATED: 'Chargeback/dispute already initiated with payment gateway',
  PLAN_EXPIRED: 'Request submitted after plan validity expired',
};
module.exports = {
  EnumCodeTypeOfCode,
  EnumOfDegree,
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
  EnumOfRefundStatus,
  EnumOfState,
  EnumOfCountry,
  EnumOfCreative,
  EnumOfDiet,
  EnumOfPrivacySetting,
  EnumForTimeDurationOfProfileHide,
  EnumOfReasonForProfileDelete,
  EnumOfImageTypes,
  EnumOfNotification,
  EnumOfCancelReason,
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
  EnumOfJobType,
  EnumOfHobby,
  EnumOfAdminRejectReason,
};
