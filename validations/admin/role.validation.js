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
    role: Joi.string()
      .valid(...Object.values(enumFields.EnumRoleOfUser))
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
    role: Joi.string()
      .valid(...Object.values(enumFields.EnumRoleOfUser))
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
  params: Joi.object().keys({
    roleId: Joi.objectId().required(),
  }),
};
export const deleteRole = {
  params: Joi.object().keys({
    roleId: Joi.objectId().required(),
  }),
};
