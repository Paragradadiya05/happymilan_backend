import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { userService } from '../../services';
import enumModel from '../../models/enum.model';

export const getByAge = catchAsync(async (req, res) => {
  const { minAge, maxAge, maritalStatus, religion, community, motherTongue } = req.body;
  if (maritalStatus && !Object.values(enumModel.EnumOfMaritalStatus).includes(maritalStatus)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid appUsesType' });
  }
  if (religion && !Object.values(enumModel.EnumOfReligion).includes(religion)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid appUsesType' });
  }
  if (community && !Object.values(enumModel.EnumOfCommunity).includes(community)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid appUsesType' });
  }
  if (motherTongue && !Object.values(enumModel.EnumOfMotherTongue).includes(motherTongue)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid appUsesType' });
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
    ...(maritalStatus && { maritalStatus }),
    ...(religion && { religion }),
    ...(community && { community }),
    ...(motherTongue && { motherTongue }),
  };

  const user = await userService.getUserList(filter, {});
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
