import Joi from 'joi';
import enumModel from '../../models/enum.model';

export const searchAge = {
  body: Joi.object().keys({
    minAge: Joi.number(),
    maxAge: Joi.number(),
    maritalStatus: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfMaritalStatus))),
    religion: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfReligion))),
    community: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfCommunity))),
    motherTongue: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfMotherTongue))),
    height: Joi.number(),
    currentCountry: Joi.string().valid(...Object.values(enumModel.EnumOfCurrentCountry)),
  }),
};

export const update = {
  params: Joi.object().keys({}),
};
