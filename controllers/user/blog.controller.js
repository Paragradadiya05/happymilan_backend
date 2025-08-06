import httpStatus from 'http-status';
import { blogservice } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.user;
  body.updatedBy = req.user;
  const options = {};
  const blog = await blogservice.createBlog(body, options);
  return res.status(httpStatus.CREATED).send({ results: blog });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { blogId } = req.params;
  const filter = {
    _id: blogId,
  };
  const options = { new: true };
  const blog = await blogservice.updateBlog(filter, body, options);
  return res.status(httpStatus.OK).send({ results: blog });
});

export const remove = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const filter = {
    _id: blogId,
  };
  const blog = await blogservice.removeBlog(filter);
  return res.status(httpStatus.OK).send({ results: blog });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const blog = await blogservice.getBlogList(filter, options);
  return res.status(httpStatus.OK).send({ results: blog });
});

export const getBlogbyId = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const filter = {
    _id: blogId,
  };
  const options = {};
  const blog = await blogservice.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: blog });
});

export const getBlogsByType = catchAsync(async (req, res) => {
  const { blogType } = req.params;

  const filter = {
    blogType,
    status: true, // Optional: Only fetch published/active blogs
  };

  const options = {
    sort: { createdAt: -1 }, // Latest first (optional)
  };

  const blogs = await blogservice.getBlogList(filter, options);
  return res.status(httpStatus.OK).send({ results: blogs });
});
