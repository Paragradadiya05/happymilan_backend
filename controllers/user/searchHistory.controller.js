import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { searchHistoryService } from '../../services';

export const createSearchHistory = catchAsync(async (req, res) => {
  const { body } = req;
  const userId = req.user._id;
  const options = {};
  const SearchHistory = await searchHistoryService.createHistory(
    {
      userId,
      ...body,
    },
    options
  );
  return res.status(httpStatus.CREATED).send({ results: SearchHistory });
});

export const listSearchHistory = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const SearchHistory = await searchHistoryService.getHistory(filter, options);
  return res.status(httpStatus.OK).send({ results: SearchHistory });
});

export const getbySearchHistoryId = catchAsync(async (req, res) => {
  const { SearchHistoryId } = req.params;
  const filter = {
    _id: SearchHistoryId,
  };
  const options = {};
  const SearchHistory = await searchHistoryService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: SearchHistory });
});

export const getbysaveSearch = catchAsync(async (req, res) => {
  const { saveSearch } = req.params;
  const filter = {
    saveSearch,
  };
  const options = {};
  const SearchHistory = await searchHistoryService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: SearchHistory });
});

export const deletebySearchHistoryId = catchAsync(async (req, res) => {
  const { SearchHistoryId } = req.params;
  const filter = {
    _id: SearchHistoryId,
  };
  const SearchHistory = await searchHistoryService.remove(filter);
  return res.status(httpStatus.OK).send({ results: SearchHistory });
});

export const getbyuserId = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    userId,
  };
  const options = {};
  const SearchHistory = await searchHistoryService.getHistory(filter, options);
  return res.status(httpStatus.OK).send({ results: SearchHistory });
});
