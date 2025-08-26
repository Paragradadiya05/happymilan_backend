import Joi from 'joi';
import enumFields from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

export const createCancelPlan = {
  body: Joi.object().keys({
    userPlanId: Joi.objectId().required(),
    planId: Joi.objectId().required(),
    cancellationReason: Joi.string()
      .valid(...Object.values(enumFields.EnumOfCancelReason))
      .required(),
    otherReason: Joi.when('cancellationReason', {
      is: enumFields.EnumOfCancelReason.OTHER,
      then: Joi.string().required(),
      otherwise: Joi.string().optional(),
    }),
    refundStatus: Joi.string().valid(...Object.values(enumFields.EnumOfRefundStatus)),
    refundAmount: Joi.number().min(0),
    effectiveCancellationDate: Joi.date(),
    status: Joi.string().valid('pending', 'approved', 'rejected'),
    hasRequested: Joi.boolean().default(false),
  }),
};

export const updateCancelPlan = {
  params: Joi.object().keys({
    cancelPlanId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    cancellationReason: Joi.string().valid(...Object.values(enumFields.EnumOfCancelReason)),
    otherReason: Joi.string(),
    refundStatus: Joi.string().valid(...Object.values(enumFields.EnumOfRefundStatus)),
    refundAmount: Joi.number().min(0),
    effectiveCancellationDate: Joi.date(),
    status: Joi.string().valid('pending', 'approved', 'rejected'),
    hasRequested: Joi.boolean().default(false),
  }),
};

export const deleteCancelPlanById = {
  params: Joi.object().keys({
    cancelPlanId: Joi.objectId().required(),
  }),
};
export const getCancelPlanById = {
  params: Joi.object().keys({
    cancelPlanId: Joi.objectId().required(),
  }),
};

export const getCancelPlanByUser = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};
