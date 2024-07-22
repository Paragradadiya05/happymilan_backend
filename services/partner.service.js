import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { Partner, User } from '../models';
import ApiError from '../utils/ApiError';
import { EnumOfPlatformType } from '../models/enum.model';

export async function getOne(query, options = {}) {
  const userPartnerDetail = await Partner.findOne(query, options.projection, options);
  return userPartnerDetail;
}

export async function getPartnerList(filter, options = {}) {
  const userPartnerDetail = await Partner.find(filter, options.projection, options);
  return userPartnerDetail;
}

export async function getPartnerListWithPagination(filter, options = {}) {
  const userPartnerDetail = await Partner.paginate(filter, options);
  return userPartnerDetail;
}

export async function createPartner(body = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const findPartner = await Partner.find({ userId: body.userId });
  let partner;
  if (findPartner.length) {
    partner = await Partner.findOneAndUpdate({ userId: body.userId }, body, {
      new: true,
    });
  } else {
    partner = await Partner.create(body);
  }
  return partner;
}

export async function updatePartner(filter, body, options = {}) {
  const userPartnerDetail = await Partner.findOneAndUpdate(filter, body, options);
  return userPartnerDetail;
}

export async function updateManyPartner(filter, body, options = {}) {
  const userPartnerDetail = await Partner.updateMany(filter, body, options);
  return userPartnerDetail;
}

export async function removePartner(filter) {
  const userPartnerDetail = await Partner.findOneAndRemove(filter);
  return userPartnerDetail;
}

export async function removeManyPartner(filter) {
  const userPartnerDetail = await Partner.deleteMany(filter);
  return userPartnerDetail;
}

export async function getMatchedUsers(userId) {
  const userPartnerPreferences = await Partner.findOne({ userId });

  if (!userPartnerPreferences) {
    throw new Error('User Partner Preferences not found');
  }

  const pipeline = [
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(userId) }, // Exclude the current user
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
      },
    },
    {
      $lookup: {
        from: 'addresses', // Assuming the collection name for Address is 'addresses'
        localField: 'address',
        foreignField: '_id',
        as: 'address',
      },
    },
    {
      $addFields: {
        age: {
          $cond: {
            if: { $and: [{ $ne: ['$dateOfBirth', null] }, { $ne: ['$dateOfBirth', ''] }] },
            then: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
                  31556952000, // Average milliseconds in a year considering leap years
                ],
              },
            },
            else: null, // Handle cases where dateOfBirth is missing or invalid
          },
        },
      },
    },
    {
      $lookup: {
        from: 'Address',
        localField: '_id',
        foreignField: 'userId',
        as: 'address',
      },
    },
    {
      $unwind: {
        path: '$address', // Deconstructs the 'address' array field
        preserveNullAndEmptyArrays: true, // If you want to exclude documents with no address
      },
    },
    {
      $lookup: {
        from: 'UserProfessionalDetail',
        localField: '_id',
        foreignField: 'userId',
        as: 'userProfessional',
      },
    },
    {
      $unwind: {
        path: '$userProfessional', // Deconstructs the 'address' array field
        preserveNullAndEmptyArrays: true, // If you want to exclude documents with no address
      },
    },
    {
      $addFields: {
        matchData: {
          $let: {
            vars: {
              totalCriteria: 6, // Update to the total number of criteria used
              matchedCriteria: {
                $add: [
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$age', userPartnerPreferences.age.min] },
                          { $lte: ['$age', userPartnerPreferences.age.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$height', userPartnerPreferences.height.min] },
                          { $lte: ['$height', userPartnerPreferences.height.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  { $cond: [{ $in: ['$address.currentCountry', userPartnerPreferences.country] }, 1, 0] },
                  // { $cond: [{ $in: ['$address.state', userPartnerPreferences.state] }, 1, 0] },
                  { $cond: [{ $in: ['$address.currentCity', userPartnerPreferences.city] }, 1, 0] },
                  // Add additional conditions as needed
                  { $cond: [{ $eq: ['$userProfessional.currentSalary', userPartnerPreferences.income] }, 1, 0] },
                  // { $cond: [{ $in: ['$creative', userPartnerPreferences.creative] }, 1, 0] },
                  { $cond: [{ $in: ['$diet', userPartnerPreferences.diet] }, 1, 0] },
                ],
              },
            },
            in: {
              matchPercentage: {
                $multiply: [{ $divide: ['$$matchedCriteria', '$$totalCriteria'] }, 100],
              },
              matchedCriteria: '$$matchedCriteria',
            },
          },
        },
      },
    },
    {
      // todo : update projection based on fe requirements
      $project: {
        _id: 1,
        age: 1,
        height: 1,
        diet: 1,
        'address._id': 1,
        'address.currentResidenceAddress': 1,
        'address.currentCity': 1,
        'address.state': 1,
        'address.currentCountry': 1,
        'userProfessional.currentSalary': 1,
        matchPercentage: '$matchData.matchPercentage',
        matchedCriteria: '$matchData.matchedCriteria',
      },
    },
    { $sort: { matchPercentage: -1 } }, // Sort by match percentage in descending order
  ];
  const matchedUsers = await User.aggregate(pipeline).exec();
  return matchedUsers;
}
