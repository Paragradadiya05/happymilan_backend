import Joi from 'joi';
import enumFields from '../../models/enum.model';

// Define a schema for access permissions
const accessSchema = Joi.object({
  view: Joi.boolean().default(false),
  add: Joi.boolean().default(false),
  update: Joi.boolean().default(false),
  delete: Joi.boolean().default(false),
});

export const addRole = {
  body: Joi.object().keys({
    user: Joi.string()
      .valid(...Object.values(enumFields.EnumOfUser))
      .required(),
    dashboard: accessSchema,
    plans: accessSchema,
    emailMarketing: accessSchema,
    paymentAndReceipts: accessSchema,
    User: accessSchema,
    blogs: accessSchema,
    roles: accessSchema,
    successStories: accessSchema,
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
