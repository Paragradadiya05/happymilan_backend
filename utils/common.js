import { Mongoose } from 'mongoose';
import contentType from './content-type.json';
import { EnumOfPrivacySetting } from '../models/enum.model';
/* eslint-disable */
export const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array);
  }
};

export function generateRandomId() {
  // Current date string
  const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(4, 8);
  // Generate random characters
  const randomChars = Array.from({ length: 4 }, () => Math.random().toString(36).charAt(2)).join('');
  // Combine date string and random characters
  const uniqueId = dateString + randomChars;
  return uniqueId;
}

/* eslint-enable */
/**
 * Check Whether Object is Mongoose Model
 * @param object
 * @returns {boolean}
 */
export const isMongooseModel = (object = {}) => {
  return object instanceof Mongoose.prototype.Model;
};

/**
 * Check Whether Object is Mongoose Documents
 * @param object
 * @returns {boolean}
 */
export const isMongooseDocument = (object = {}) => {
  return object instanceof Mongoose.prototype.Document;
};

/**
 * Check Whether Object is Mongoose ObjectId
 * @param data
 * @returns {boolean}
 */
export const isObjectId = (data = {}) => {
  return Mongoose.prototype.isValidObjectId(data);
};

/**
 * @param {String} string
 * @returns {string}
 */
export const capitalizeFirstLetter = (string = '') => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 *
 * @returns {number}
 */
export const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

export const transFormCardResponse = (paymentMethod) => {
  const {
    card: { exp_month: expMonth, exp_year: expYear, last4 },
    billing_details: {
      address: { city, country, line1, line2, postal_code: postalCode, state },
      name,
    },
    id,
  } = paymentMethod;
  return { expMonth, expYear, last4, id, city, country, line1, line2, postalCode, state, name };
};

export const transFormAccountResponse = (account) => {
  const { object } = account;
  if (object === 'bank_account') {
    const { bank_name: bankName, country, last4, routing_number: routingNumber } = account;
    return { type: 'payout', object, bankName, country, last4, routingNumber };
  }
  if (object === 'card') {
    const { brand, country, exp_month: expMonth, exp_year: expYear, funding, last4 } = account;
    return { type: 'payout', object, brand, country, expMonth, expYear, funding, last4 };
  }
  return {};
};

export const getUserField = (field = '') => {
  return `firstName lastName ${field}`;
};
/* eslint-disable */
export function sortObjectByKeys(o) {
  return Object.keys(o)
    .sort()
    .reduce((r, k) => ((r[k] = o[k]), r), {});
}

/* eslint-enable */
export const getBatchedIterable = async function* (cursor, batchSize) {
  let batch = [];
  let hasNext = false;
  do {
    /* eslint-disable no-await-in-loop */
    const item = await cursor.next();
    /* eslint-enable no-await-in-loop */
    hasNext = !!item;
    if (hasNext) batch.push(item);
    if (batch.length === batchSize) {
      yield batch;
      batch = [];
    }
  } while (hasNext);
  if (batch.length) yield batch;
};

export const getQueueUrlFromArn = (arn, sqs) => {
  const accountId = arn.split(':')[4];
  const queueName = arn.split(':')[5];
  return `${sqs.endpoint.href + accountId}/${queueName}`;
};

export const validUrl = (s) => {
  try {
    const url = new URL(s);
    return url;
  } catch (err) {
    return false;
  }
};

export const addDays = (theDate, days) => {
  return new Date(theDate.getTime() + days * 24 * 60 * 60 * 1000);
};

export const getMimeType = (allowedExtension) => {
  return allowedExtension.map((ext) => {
    const obj = contentType.find((c) => c.key === ext);
    return obj ? obj.mimeType : '';
  });
};

export const defaultFields = {
  age: '$age',
  height: '$height',
  address: {
    _id: { $getField: { field: '_id', input: '$address' } },
    currentResidenceAddress: { $getField: { field: 'currentResidenceAddress', input: '$address' } },
    currentCity: { $getField: { field: 'currentCity', input: '$address' } },
    state: { $getField: { field: 'state', input: '$address' } },
    currentCountry: { $getField: { field: 'currentCountry', input: '$address' } },
    createdAt: { $getField: { field: 'createdAt', input: '$address' } },
    updatedAt: { $getField: { field: 'updatedAt', input: '$address' } },
  },
  appUsesType: '$appUsesType',
  emailVerified: '$emailVerified',
  maritalStatus: '$maritalStatus',
  gender: '$gender',
  // dateOfBirth: '$dateOfBirth',
  // birthTime: '$birthTime',
  // religion: '$religion',
  // caste: '$caste',
  hobbies: '$hobbies',
  interest: '$interest',
  // homeMobileNumber: '$homeMobileNumber',
  // creatingProfileFor: '$creatingProfileFor',
  writeBoutYourSelf: '$writeBoutYourSelf',
  community: '$community',
  motherTongue: '$motherTongue',
  weight: '$weight',
  // userEducation: '$userEducation',
  // userProfessional: {
  //   _id: { $getField: { field: '_id', input: '$userProfessional' } },
  //   jobTitle: { $getField: { field: 'jobTitle', input: '$userProfessional' } },
  //   jobType: { $getField: { field: 'jobType', input: '$userProfessional' } },
  //   companyName: { $getField: { field: 'companyName', input: '$userProfessional' } },
  //   currentSalary: { $getField: { field: 'currentSalary', input: '$userProfessional' } },
  //   workCity: { $getField: { field: 'workCity', input: '$userProfessional' } },
  //   workCountry: { $getField: { field: 'workCountry', input: '$userProfessional' } },
  // },
  userUniqueId: '$userUniqueId',
  privacySetting: '$privacySetting',
  privacySettingCustom: '$privacySettingCustom',
  profilePhotoPrivacy: '$profilePhotoPrivacy',
};

export const fields = [
  // user profile photo
  { name: 'profilePic' },
  { name: 'userProfilePic' },
  { name: 'userProfileVideo' },
  // general details
  { name: 'firstName' },
  { name: 'lastName' },
  { name: 'dateOfBirth' },
  { name: 'birthTime' },
  { name: 'religion' },
  { name: 'caste' },
  { name: 'height' },
  { name: 'weight' },
  { name: 'displayName' },
  { name: 'name' },
  { name: 'randomId' },
  { name: 'maritalStatus' },
  { name: 'address' },
  { name: 'gender' },

  // contact details this will be hidden for all
  // { name: 'email', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },
  // { name: 'mobileNumber', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },

  // education details
  { name: 'userEducation' },

  // Professional Details
  { name: 'userProfessional' },
  { name: 'hobbies' },
  { name: 'userPartnerDetails' },
  { name: 'userUniqueId' },
  { name: 'privacySetting' },
  { name: 'motherTongue' },
  { name: 'isUserActive' },
  { name: 'age' },
  { name: 'maritalStatus' },
  { name: 'writeBoutYourSelf' },
  { name: 'profilePhotoPrivacy' },
  { name: 'privacySettingCustom' },
  { name: 'isPremiumUser' },
];

// eslint-disable-next-line no-shadow
export const createDynamicProjectionForPrivacySetting = (fields, defaultFields) => {
  const projection = {
    _id: 1,
    matchPercentage: '$matchData.matchPercentage',
    matchedCriteria: '$matchData.matchedCriteria',
    matchedFields: '$matchData.matchedFields',
    'userLikeDetails.isLike': 1,
    'userLikeDetails.user': { $getField: { field: 'user', input: '$userLikeDetails' } },
    'userLikeDetails.likedUserId': { $getField: { field: 'likedUserId', input: '$userLikeDetails' } },
    'userLikeDetails._id': { $getField: { field: '_id', input: '$userLikeDetails' } },
    'userShortListDetails.userId': 1,
    'userShortListDetails.shortlistId': { $getField: { field: 'shortlistId', input: '$userShortListDetails' } },
    'userShortListDetails.id': { $getField: { field: '_id', input: '$userShortListDetails' } },
    'subscriptionDetails.status': { $getField: { field: 'status', input: '$subscriptionDetails' } },
    'subscriptionDetails.selectedPlan': { $getField: { field: 'selectedPlan', input: '$subscriptionDetails' } },
    'friendsDetails.status': { $getField: { field: 'status', input: '$friendsDetails' } },
    'friendsDetails._id': { $getField: { field: '_id', input: '$friendsDetails' } },
  };

  // Add default fields if privacySetting is 'default'
  projection.defaultFields = {
    $cond: {
      if: { $eq: ['$privacySetting', 'default'] },
      then: defaultFields,
      else: {},
    },
  };

  // Add individual field conditions with an additional check for premium user
  fields.forEach(({ name }) => {
    // console.log('$privacySettingCustom.publicProfile === ', `$privacySettingCustom.publicProfile`);
    projection[name] = {
      $cond: {
        if: {
          $or: [
            // Check if the field is in `publicProfile`
            {
              $and: [
                { $eq: ['$privacySetting', EnumOfPrivacySetting.PUBLIC_PROFILE] },
                { $in: [name, { $ifNull: ['$privacySettingCustom.publicProfile', []] }] },
              ],
            },
            // Check if the field is in `privateProfile` and the user is private
            {
              $and: [
                { $eq: ['$privacySetting', EnumOfPrivacySetting.PRIVATE_PROFILE] },

                {
                  $in: [
                    name,
                    {
                      $ifNull: ['$privacySettingCustom.privateProfile', []],
                    },
                  ],
                },
              ],
            },
            // Check if the field is in `premiumProfile` and the user is premium
            {
              $and: [
                { $eq: ['$privacySetting', EnumOfPrivacySetting.PREMIUM_PROFILE] },
                { $in: [name, { $ifNull: ['$privacySettingCustom.premiumProfile', []] }] },
                // { $literal: isPremiumUser },
              ],
            },

            // // Check for `OnlyAcceptedMembers` and friend status
            // {
            //   $and: [
            //     { $eq: ['$privacySetting', 'OnlyAcceptedMembers'] },
            //     { $eq: ['$friendsDetails.status', 'ACCEPTED'] }, // EnumStatusOfFriend.ACCEPTED
            //   ],
            // },
            // // // Fallback to `privateProfile` if friend status is not ACCEPTED
            // {
            //   $and: [
            //     { $eq: ['$privacySetting', 'OnlyAcceptedMembers'] },
            //     { $ne: ['$friendsDetails.status', 'ACCEPTED'] },
            //     { $in: ['privateProfile', conditions] },
            //   ],
            // },
          ],
        },
        then: `$${name}`,
        else: null,
      },
    };
  });

  return projection;
};

// eslint-disable-next-line no-shadow
export const createDynamicProjectionForPrivacySettingForDating = (fields, defaultFields) => {
  const projection = {
    _id: 1,
    matchPercentage: '$matchData.matchPercentage',
    matchedCriteria: '$matchData.matchedCriteria',
    matchedFields: '$matchData.matchedFields',
    userLikeDetails: 1,
    'userShortListDetails.userId': 1,
    'userShortListDetails.shortlistId': { $getField: { field: 'shortlistId', input: '$userShortListDetails' } },
    'userShortListDetails.id': { $getField: { field: '_id', input: '$userShortListDetails' } },
    'subscriptionDetails.status': { $getField: { field: 'status', input: '$subscriptionDetails' } },
    'subscriptionDetails.selectedPlan': { $getField: { field: 'selectedPlan', input: '$subscriptionDetails' } },
    friendsDetails: 1,
  };

  // Add default fields if privacySetting is 'default'
  projection.defaultFields = {
    $cond: {
      if: { $eq: ['$privacySetting', 'default'] },
      then: defaultFields,
      else: {},
    },
  };

  // Add individual field conditions with an additional check for premium user
  fields.forEach(({ name }) => {
    // console.log('$privacySettingCustom.publicProfile === ', `$privacySettingCustom.publicProfile`);
    projection[name] = {
      $cond: {
        if: {
          $or: [
            // Check if the field is in `publicProfile`
            {
              $and: [
                { $eq: ['$privacySetting', EnumOfPrivacySetting.PUBLIC_PROFILE] },
                { $in: [name, { $ifNull: ['$privacySettingCustom.publicProfile', []] }] },
              ],
            },
            // Check if the field is in `privateProfile` and the user is private
            {
              $and: [
                { $eq: ['$privacySetting', EnumOfPrivacySetting.PRIVATE_PROFILE] },

                {
                  $in: [
                    name,
                    {
                      $ifNull: ['$privacySettingCustom.privateProfile', []],
                    },
                  ],
                },
              ],
            },
            // Check if the field is in `premiumProfile` and the user is premium
            {
              $and: [
                { $eq: ['$privacySetting', EnumOfPrivacySetting.PREMIUM_PROFILE] },
                { $in: [name, { $ifNull: ['$privacySettingCustom.premiumProfile', []] }] },
                // { $literal: isPremiumUser },
              ],
            },

            // // Check for `OnlyAcceptedMembers` and friend status
            // {
            //   $and: [
            //     { $eq: ['$privacySetting', 'OnlyAcceptedMembers'] },
            //     { $eq: ['$friendsDetails.status', 'ACCEPTED'] }, // EnumStatusOfFriend.ACCEPTED
            //   ],
            // },
            // // // Fallback to `privateProfile` if friend status is not ACCEPTED
            // {
            //   $and: [
            //     { $eq: ['$privacySetting', 'OnlyAcceptedMembers'] },
            //     { $ne: ['$friendsDetails.status', 'ACCEPTED'] },
            //     { $in: ['privateProfile', conditions] },
            //   ],
            // },
          ],
        },
        then: `$${name}`,
        else: null,
      },
    };
  });

  return projection;
};
