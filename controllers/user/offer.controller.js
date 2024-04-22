import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { offerService } from '../../services';

export const create = catchAsync(async (req, res) => {
  const offer = await offerService.createOffer(req.body, req.user);
  return res.status(httpStatus.CREATED).send({ results: offer });
});
export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const offer = await offerService.getOffer(filter, options);
  return res.status(httpStatus.OK).send({ results: offer });
});
