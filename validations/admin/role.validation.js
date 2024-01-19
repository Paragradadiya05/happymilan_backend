import Joi from 'joi';
import enumFields from '../../models/enum.model';

export const addRole = {
  body: Joi.object().keys({
    user: Joi.string()
      .valid(...Object.values(enumFields.EnumOfUser))
      .required(),
    dashboard: Joi.boolean(),
    plans: Joi.boolean(),
    emailMarketing: Joi.boolean(),
    paymentAndReceipts: Joi.boolean(),
    User: Joi.boolean(),
    blogs: Joi.boolean(),
    roles: Joi.boolean(),
    successStories: Joi.boolean(),
    new: Joi.boolean(),
    edit: Joi.boolean(),
    view: Joi.boolean(),
    delete: Joi.boolean(),
  }),
};

export const rolelist = {
  body: Joi.object().keys({}),
};

export const updatePlan = {
  body: Joi.object().keys({
    user: Joi.string()
      .valid(...Object.values(enumFields.EnumOfUser))
      .required(),
    dashboard: Joi.boolean(),
    plans: Joi.boolean(),
    emailMarketing: Joi.boolean(),
    paymentAndReceipts: Joi.boolean(),
    User: Joi.boolean(),
    blogs: Joi.boolean(),
    roles: Joi.boolean(),
    successStories: Joi.boolean(),
    new: Joi.boolean(),
    edit: Joi.boolean(),
    view: Joi.boolean(),
    delete: Joi.boolean(),
  }),
  params: Joi.object().keys({
    roleId: Joi.objectId().required(),
  }),
};
export const deleteRole = {
  params: Joi.object().keys({
    roleId: Joi.objectId().required(),
  }),
};
