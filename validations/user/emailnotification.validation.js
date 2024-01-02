import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

// eslint-disable-next-line import/prefer-default-export
export const createNotification = {
  body: Joi.object().keys({
    MyAletrsManager: Joi.string().required(),

    matchMailAndPhotoMatchMail: Joi.array()
      .items(
        Joi.object().keys({
          option: Joi.string().required(),
          isSelected: Joi.boolean().required(),
        })
      )
      .required(),
    emailAlert: Joi.array()
      .items(
        Joi.object().keys({
          option: Joi.string().required(),
          isSelected: Joi.boolean().required(),
        })
      )
      .required(),
  }),
};

export const getNotification = {
  body: Joi.object().keys({}),
};
