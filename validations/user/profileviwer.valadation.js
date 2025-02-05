import Joi from 'joi';
import { EnumAppUsesTypeOfUsers } from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

export const createProfileviwer = {
  body: Joi.object().keys({
    viewerId: Joi.objectId().required(),
  }),
  query: Joi.object()
    .keys({
      appUsesType: Joi.string()
        .valid(...Object.values(EnumAppUsesTypeOfUsers))
        .optional(),
    })
    .unknown(true),
};
export const GetProfileviwer = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const GetProfilevisitors = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};
