import Joi from 'joi';
import enumModel from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

export const createKyc = {
  body: Joi.object().keys({
    kycDocName: Joi.string()
      .valid(...Object.values(enumModel.EnumOfKyc))
      .required(),
    kycDocImagePath: Joi.string().required(),
    verify: Joi.boolean().default(false),
    verifyUserId: Joi.boolean().default(false),
    userId: Joi.objectId(),
    isDocRejected: Joi.boolean().default(false),
    isDocUpload: Joi.boolean().default(false),
    rejectReason: Joi.string().optional(),
  }),
};

export const updateKyc = {
  body: Joi.object().keys({
    kycDocName: Joi.string()
      .valid(...Object.values(enumModel.EnumOfKyc))
      .required(),
    kycDocImagePath: Joi.string().required(),
    verify: Joi.boolean().default(false),
    verifyUserId: Joi.boolean().default(false),
    userId: Joi.objectId(),
    isDocRejected: Joi.boolean().default(false),
    isDocUpload: Joi.boolean().default(false),
    rejectReason: Joi.string().optional(),
  }),
  params: Joi.object().keys({
    KycId: Joi.objectId().required(),
  }),
};

export const getKycById = {
  params: Joi.object().keys({
    KycId: Joi.objectId().required(),
  }),
};
export const getKycByuserId = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const deleteKycById = {
  params: Joi.object().keys({
    KycId: Joi.objectId().required(),
  }),
};

export const getKyc = {
  body: Joi.object().keys({}).unknown(true),
};

export const paginatedKyc = {
  body: Joi.object().keys({}).unknown(true),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};
