import Joi from 'joi';
import { EnumAppUsesTypeOfUsers } from '../../models/enum.model';

// eslint-disable-next-line import/prefer-default-export
export const getUserByappUsesType = {
  params: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
  // Add validation for query parameters
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
  }),
};
