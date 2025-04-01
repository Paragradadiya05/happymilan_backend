import Joi from 'joi';
import enumFields from 'models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

const codesEmbed = Joi.object().keys({
  code: Joi.string(),
  expirationDate: Joi.date(),
  used: Joi.bool(),
  codeType: Joi.string().valid(...Object.values(enumFields.EnumCodeTypeOfCode)),
});
const facebookProviderEmbed = Joi.object().keys({
  id: Joi.string(),
  token: Joi.string(),
});
const googleProviderEmbed = Joi.object().keys({
  id: Joi.string(),
  token: Joi.string(),
});
const appleProviderEmbed = Joi.object().keys({
  id: Joi.string(),
  token: Joi.string(),
});
const githubProviderEmbed = Joi.object().keys({
  id: Joi.string(),
  token: Joi.string(),
});
export const createUser = {
  body: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string().email(),
    role: Joi.string().valid(...Object.values(enumFields.EnumRoleOfUser)),
    codes: Joi.array().items(codesEmbed),
    password: Joi.string(),
    facebookProvider: facebookProviderEmbed,
    googleProvider: googleProviderEmbed,
    appleProvider: appleProviderEmbed,
    githubProvider: githubProviderEmbed,
  }),
};

export const updateUser = {
  body: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string().email(),
    role: Joi.string().valid(...Object.values(enumFields.EnumRoleOfUser)),
    codes: Joi.array().items(codesEmbed),
    password: Joi.string(),
    facebookProvider: facebookProviderEmbed,
    googleProvider: googleProviderEmbed,
    appleProvider: appleProviderEmbed,
    githubProvider: githubProviderEmbed,
  }),
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const deleteUserImages = {
  body: Joi.object().keys({
    profileImageUrl: Joi.string().required(),
    name: Joi.string().required(),
  }),
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const getUserById = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const deleteUserById = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const deleteUser = {
  params: Joi.object().keys({}),
};

export const getUser = {
  body: Joi.object().keys({}).unknown(true),
};

export const paginatedUser = {
  body: Joi.object().keys({}).unknown(true),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};

export const paginatedUserThatNotFriend = {
  body: Joi.object().keys({}).unknown(true),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};

export const get = {
  params: Joi.object().keys({
    userUniqueId: Joi.string().required(),
  }),
};

export const getUserByGender = {
  params: Joi.object().keys({}),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};
export const getprimeuser = {
  params: Joi.object().keys({}),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};
export const getMatchUser = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const getUserByGenderDating = {
  params: Joi.object().keys({}),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};

export const getUserByGenderAndAgeAndMatchDating = {
  body: Joi.object().keys({
    minAge: Joi.number().required(),
    maxAge: Joi.number().required(),
  }),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};

export const getFilteredDatingUsers = {
  body: Joi.object().keys({
    interestedIn: Joi.string().valid(...Object.values(enumFields.EnumOfInterest)),
  }),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};

export const searchUser = {
  body: Joi.object().keys({
    Ethnicity: Joi.string(),
  }),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};
export const getnewuser = {
  params: Joi.object().keys({}),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};

export const updateUserPrivacy = {
  body: Joi.object().keys({
    privacySetting: Joi.string().valid('publicProfile', 'privateProfile', 'premiumProfile'),
    privacySettingCustom: Joi.object().keys({
      profilePhotoPrivacy: Joi.boolean().default(false),
      showPhotoToFriendsOnly: Joi.boolean().default(false),
      address: Joi.boolean().default(false),
      contact: Joi.boolean().default(false),
      professional: Joi.boolean().default(false),
      publicProfile: Joi.array().items(Joi.string()),
      privateProfile: Joi.array().items(Joi.string()),
      premiumProfile: Joi.array().items(Joi.string()),
    }),
  }),
};
