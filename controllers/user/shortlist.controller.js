import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { shortlistervice } from '../../services';

export const createShortlist = catchAsync(async (req, res) => {
  const shortlist = await shortlistervice.createshortList(req.body);
  return res.status(httpStatus.OK).send({ results: shortlist });
});

export const getshortlist = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const user = await shortlistervice.getshortlist(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});
