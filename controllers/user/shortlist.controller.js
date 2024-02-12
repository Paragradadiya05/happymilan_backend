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
export const getShortlistByUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    userId,
  };
  const options = {};
  const escalate = await shortlistervice.getShortlist(filter, options);
  return res.status(httpStatus.OK).send({ results: escalate });
});
export const getshortlist = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const user = await shortlistervice.getShortlist(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const deleteShortlistByUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    userId,
  };
  const escalate = await shortlistervice.removeshotylist(filter);
  return res.status(httpStatus.OK).send({ results: escalate });
});
