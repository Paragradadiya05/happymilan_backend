import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { storyViewService } from '../../services';

export const createView = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.user;
  body.updatedBy = req.user;
  const options = {};
  const Storyview = await storyViewService.createStoryView(body, options);
  return res.status(httpStatus.CREATED).send({ results: Storyview });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const Storyview = await storyViewService.getList(filter, options);
  return res.status(httpStatus.OK).send({ results: Storyview });
});

export const Paginated = catchAsync(async (req, res) => {
  const userId = req.user;
  const { statusId } = req.params;
  const { page, limit } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 15);
  const filter = { userId, statusId };
  const options = {
    page: pageNumber,
    limit: limitNumber,
  };
  const Storyview = await storyViewService.getListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: Storyview });
});
