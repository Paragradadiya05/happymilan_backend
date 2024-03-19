import Joi from 'joi';
import enumModel from '../../models/enum.model';

export const searchUser = {
  body: Joi.object().keys({
    minAge: Joi.number(),
    maxAge: Joi.number(),
    maritalStatus: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfMaritalStatus))),
    religion: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfReligion))),
    community: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfCommunity))),
    motherTongue: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfMotherTongue))),
    minHeight: Joi.number(),
    maxHeight: Joi.number(),
    currentCountry: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfCurrentCountry))),
    currentCity: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfCity))),
  }),
};

export const update = {
  params: Joi.object().keys({}),
};
