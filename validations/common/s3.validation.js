import Joi from 'joi';
import enumFields from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);
// eslint-disable-next-line import/prefer-default-export
export const preSignedPutUrl = {
  body: Joi.object().keys({
    key: Joi.string().required(),
    contentType: Joi.string().required(),
    isProfilePic: Joi.boolean(),
    profileType: Joi.string()
      .valid(...Object.values(enumFields.EnumOfImageTypes))
      .required(),
    caption: Joi.string(),
  }),
};

export const preSignedPutUrlv2 = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    key: Joi.string().required(),
    contentType: Joi.string(),
  }),
};

export const sendProposal = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    emailAddresh: Joi.string().required(),
    contactNo: Joi.string().required(),
    projectDescription: Joi.string().required(),
    attachments: Joi.object({
      filename: Joi.string().required(),
      content: Joi.string(),
    }),
  }),
};
