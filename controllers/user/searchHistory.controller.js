import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { searchHistoryService } from '../../services';

export const createSearchHistory = catchAsync(async (req, res) => {
  const { body } = req;
  const userId = req.user._id;
  const options = {};
  const userPartner = await searchHistoryService.createHistory(
    {
      userId,
      ...body,
    },
    options
  );
  return res.status(httpStatus.CREATED).send({ results: userPartner });
});

export const listSearchHistory = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const Partner = await searchHistoryService.getHistory(filter, options);
  return res.status(httpStatus.OK).send({ results: Partner });
});
