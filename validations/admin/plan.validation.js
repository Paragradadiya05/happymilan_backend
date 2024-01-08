import Joi from 'joi';
import enumFields from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

export const createPlan = {
  body: Joi.object().keys({
    planName: Joi.string().valid(...Object.values(enumFields.EnumOfPlan)),
    planDuration: Joi.string().valid(...Object.values(enumFields.EnumOfPlanDuration)),
    allowNumberOfProfile: Joi.number().required(),
    allowNumberOfRequest: Joi.number().required(),
    onlineSupport: Joi.string().valid(...Object.values(enumFields.EnumOfOnlineSupport)),
    discount: Joi.number().required(),
    price: Joi.number().required(),
  }),
};

export const updatePlan = {
  body: Joi.object().keys({
    planName: Joi.string().valid(...Object.values(enumFields.EnumOfPlan)),
    planDuration: Joi.string().valid(...Object.values(enumFields.EnumOfPlanDuration)),
    allowNumberOfProfile: Joi.number().required(),
    allowNumberOfRequest: Joi.number().required(),
    onlineSupport: Joi.string().valid(...Object.values(enumFields.EnumOfOnlineSupport)),
    discount: Joi.number().required(),
    price: Joi.number().required(),
  }),
  params: Joi.object().keys({
    planId: Joi.objectId().required(),
  }),
};
