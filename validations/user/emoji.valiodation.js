import Joi from 'joi';

export const uploadEmoji = {
  body: Joi.object().keys({
    key: Joi.string().required(),
    contentType: Joi.string().required(),
  }),
};

export const getEmoji = {
  body: Joi.object().keys({}),
};
