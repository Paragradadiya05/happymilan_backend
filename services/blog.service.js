import { Blog } from 'models';

export async function createBlog(body = {}) {
  const blog = await Blog.create(body);
  return blog;
}

export async function updateBlog(filter, body, options = {}) {
  const blog = await Blog.findOneAndUpdate(filter, body, options);
  return blog;
}

export async function removeBlog(filter) {
  const blog = await Blog.findOneAndRemove(filter);
  return blog;
}

export async function getBlogList(filter, options = {}) {
  const blog = await Blog.find(filter, options.projection, options);
  return blog;
}

export async function getOne(query, options = {}) {
  const blog = await Blog.findOne(query, options.projection, options);
  return blog;
}
