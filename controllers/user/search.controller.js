import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { userService } from '../../services';
import enumModel from '../../models/enum.model';

export const searchUser = catchAsync(async (req, res) => {
  const {
    minAge,
    maxAge,
    maritalStatus,
    religion,
    community,
    motherTongue,
    minHeight,
    maxHeight,
    currentCountry,
    currentCity,
    state,
  } = req.body;
  const { page = 1, limit = 10 } = req.query;
  if (maritalStatus && !Array.isArray(maritalStatus)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'maritalStatus must be an array' });
  }
  if (maritalStatus) {
    const validMaritalStatusValues = Object.values(enumModel.EnumOfMaritalStatus);
    const invalidValues = maritalStatus.filter((value) => !validMaritalStatusValues.includes(value));
    if (invalidValues.length > 0) {
      return res.status(httpStatus.BAD_REQUEST).send({ error: `Invalid maritalStatus values` });
    }
  }
  if (religion && !Array.isArray(religion)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'religion must be an array' });
  }
  if (religion) {
    const validReligionValues = Object.values(enumModel.EnumOfReligion);
    const invalidValues = religion.filter((value) => !validReligionValues.includes(value));
    if (invalidValues.length > 0) {
      return res.status(httpStatus.BAD_REQUEST).send({ error: `Invalid religion values` });
    }
  }
  if (community && !Array.isArray(community)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'community must be an array' });
  }
  if (community) {
    const validCommunityValues = Object.values(enumModel.EnumOfCommunity);
    const invalidValues = community.filter((value) => !validCommunityValues.includes(value));
    if (invalidValues.length > 0) {
      return res.status(httpStatus.BAD_REQUEST).send({ error: `Invalid community values` });
    }
  }
  if (motherTongue && !Array.isArray(motherTongue)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'motherTongue must be an array' });
  }
  if (motherTongue) {
    const validMotherTongueValues = Object.values(enumModel.EnumOfMotherTongue);
    const invalidValues = motherTongue.filter((value) => !validMotherTongueValues.includes(value));
    if (invalidValues.length > 0) {
      return res.status(httpStatus.BAD_REQUEST).send({ error: `Invalid motherTongue values` });
    }
  }
  if (currentCountry && !Array.isArray(currentCountry)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'currentCountry must be an array' });
  }
  if (currentCountry) {
    const validCurrentCountryValues = Object.values(enumModel.EnumOfCurrentCountry);
    const invalidValues = currentCountry.filter((value) => !validCurrentCountryValues.includes(value));
    if (invalidValues.length > 0) {
      return res.status(httpStatus.BAD_REQUEST).send({ error: `Invalid currentCountry values` });
    }
  }
  if (state && !Array.isArray(state)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'state must be an array' });
  }
  if (state) {
    const validStateValues = Object.values(enumModel.EnumOfState);
    const invalidValues = state.filter((value) => !validStateValues.includes(value));
    if (invalidValues.length > 0) {
      return res.status(httpStatus.BAD_REQUEST).send({ error: `Invalid state values` });
    }
  }
  const filter = {
    ...((minAge || maxAge) && {
      dateOfBirth: {
        ...(minAge && {
          $lte: new Date(new Date().setFullYear(new Date().getFullYear() - parseInt(minAge, 10))),
        }),
        ...(maxAge && {
          $gte: new Date(new Date().setFullYear(new Date().getFullYear() - parseInt(maxAge, 10))),
        }),
      },
    }),
    ...(maritalStatus && maritalStatus.length > 0 && { maritalStatus: { $in: maritalStatus } }),
    ...(religion && religion.length > 0 && { religion: { $in: religion } }),
    ...(community && community.length > 0 && { community: { $in: community } }),
    ...(motherTongue && motherTongue.length > 0 && { motherTongue: { $in: motherTongue } }),
    ...(minHeight &&
      maxHeight && {
        height: {
          $gte: minHeight, // Minimum height
          $lte: maxHeight, // Maximum height
        },
      }),
    ...(state && state.length > 0 && { state: { $in: state } }),
  };

  const user = await userService.getUserListForSearch(
    filter,
    { currentCountry, currentCity, state },
    parseInt(page, 10),
    parseInt(limit, 10)
  );
  return res.status(httpStatus.OK).send({ results: user });
});

export const getmaritalstatus = catchAsync(async (req, res) => {
  const { appUsesType } = req.params;
  const filter = {
    EnumAppUsesTypeOfUsers: appUsesType,
  };
  // const validAppUsesTypes = Object.values(enumModel.EnumAppUsesTypeOfUsers);
  // if (!validAppUsesTypes.includes(appUsesType)) {
  //   return res.status(400).json({ error: 'Invalid appUsesType' });
  // }
  const options = {};

  const user = await userService.getUserList(filter, options);

  return res.status(httpStatus.OK).send({ results: user });
});
