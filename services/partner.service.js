import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { Partner, User } from '../models';
import ApiError from '../utils/ApiError';

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
  try {
    const currentUser = await User.findById(userId).populate('userPartner').populate('address');

    if (!currentUser) {
      throw new Error('User not found');
    }
    console.log('=====currentUser====>', currentUser);
    const partnerPreferences = currentUser.userPartner;

    if (!partnerPreferences) {
      throw new Error('UserPartner preferences not found');
    }

    const pipeline = [
      {
        $match: {
          _id: { $ne: mongoose.Types.ObjectId(userId) },
          isProfileVisible: true,
        },
      },
      {
        $addFields: {
          matchPercentage: {
            $let: {
              vars: {
                totalFields: {
                  $add: [
                    { $cond: [{ $ifNull: ['$dateOfBirth', false] }, 1, 0] },
                    { $cond: [{ $ifNull: ['$height', false] }, 1, 0] },
                    { $cond: [{ $ifNull: ['$address.currentCountry', false] }, 1, 0] },
                    { $cond: [{ $ifNull: ['$address.currentState', false] }, 1, 0] },
                    { $cond: [{ $ifNull: ['$address.currentCity', false] }, 1, 0] },
                    { $cond: [{ $ifNull: ['$userProfessional.currentSalary', false] }, 1, 0] },
                    { $cond: [{ $ifNull: ['$hobbies.category.creative', false] }, 1, 0] },
                    { $cond: [{ $ifNull: ['$diet', false] }, 1, 0] },
                  ],
                },
                matchedFields: {
                  $add: [
                    {
                      $cond: [
                        {
                          $and: [
                            { $ifNull: ['$dateOfBirth', false] },
                            {
                              $gte: [
                                { $subtract: [{ $year: new Date() }, { $year: '$dateOfBirth' }] },
                                partnerPreferences.age.min,
                              ],
                            },
                            {
                              $lte: [
                                { $subtract: [{ $year: new Date() }, { $year: '$dateOfBirth' }] },
                                partnerPreferences.age.max,
                              ],
                            },
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
                            { $ifNull: ['$height', false] },
                            { $gte: ['$height', partnerPreferences.height.min] },
                            { $lte: ['$height', partnerPreferences.height.max] },
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
                            { $ifNull: ['$address.currentCountry', false] },
                            { $in: ['$address.currentCountry', partnerPreferences.country] },
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
                            { $ifNull: ['$address.currentState', false] },
                            { $in: ['$address.currentState', partnerPreferences.state] },
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
                            { $ifNull: ['$address.currentCity', false] },
                            { $in: ['$address.currentCity', partnerPreferences.city] },
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
                            { $ifNull: ['$userProfessional.currentSalary', false] },
                            { $eq: ['$userProfessional.currentSalary', partnerPreferences.income] },
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
                            { $ifNull: ['$hobbies.category', false] },
                            { $setIsSubset: [partnerPreferences.creative, '$hobbies.category.creative'] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                    {
                      $cond: [
                        {
                          $and: [{ $ifNull: ['$diet', false] }, { $eq: ['$diet', partnerPreferences.diet] }],
                        },
                        1,
                        0,
                      ],
                    },
                  ],
                },
              },
              in: {
                $multiply: [
                  {
                    $cond: [
                      { $eq: ['$$totalFields', 0] },
                      0,
                      {
                        $divide: ['$$matchedFields', '$$totalFields'],
                      },
                    ],
                  },
                  100,
                ],
              },
            },
          },
        },
      },
      {
        $match: {
          matchPercentage: { $gt: 0 },
        },
      },
      {
        $sort: { matchPercentage: -1 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          dateOfBirth: 1,
          height: 1,
          'address.currentCountry': 1,
          'address.currentState': 1,
          'address.currentCity': 1,
          'userProfessional.currentSalary': 1,
          'hobbies.category.creative': 1,
          diet: 1,
          matchPercentage: 1,
        },
      },
    ];

    const matchedUsers = await User.aggregate(pipeline).exec();
    return matchedUsers;
  } catch (error) {
    throw new Error(`Error in getMatchedUsers: ${error.message}`);
  }
}
