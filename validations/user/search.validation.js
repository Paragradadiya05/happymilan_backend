import Joi from 'joi';
import enumModel, { EnumAppUsesTypeOfUsers } from '../../models/enum.model';

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
    state: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfState))),
    currentCity: Joi.array().items(Joi.string()),
  }),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
      appUsesType: Joi.string()
        .valid(...Object.values(EnumAppUsesTypeOfUsers))
        .optional(),
    })
    .unknown(true),
};

export const update = {
  params: Joi.object().keys({}),
};
