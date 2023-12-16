import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { shortlistervice } from '../../services';

export const createShortlist = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const body = {
    shortlistId: req.body.shortlistId,
    userId,
  };
  body.createdBy = req.user;
  body.updatedBy = req.user;
  const shortlist = await shortlistervice.createshortList(body);
  return res.status(httpStatus.OK).send({ results: shortlist });
});

export const getshortlist = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const user = await shortlistervice.getShortlist(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});
