import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { userService } from '../../services';

export const getByAge = catchAsync(async (req, res) => {
  const { minAge, maxAge } = req.body;

  // const filter = {};
  // todo:more changes
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
