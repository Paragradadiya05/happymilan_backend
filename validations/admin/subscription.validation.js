import Joi from 'joi';
import enumFields from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

export const createSubcription = {
  body: Joi.object().keys({
    user: Joi.any().required(),
    selectedPlan: Joi.string().valid(...Object.values(enumFields.EnumOfPlan)),
  }),
};

export const subscriptionlist = {
  body: Joi.object().keys({}),
};
export const updatesubscription = {
  params: Joi.object().keys({
    subscriptionId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    user: Joi.any().required(),
    selectedPlan: Joi.string().valid(...Object.values(enumFields.EnumOfPlan)),
  }),
};
