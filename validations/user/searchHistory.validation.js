import Joi from 'joi';
import enumModel from '../../models/enum.model';

export const getSearchHistory = {
  body: Joi.object().keys({}).unknown(true),
};

export const createSearchHistory = {
  body: Joi.object().keys({
    userId: Joi.objectId(),
    minAge: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required(),
    }),
    height: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required(),
    }),
    weight: Joi.object({
      min: Joi.number(),
      max: Joi.number(),
    }),
    maritalStatus: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfMaritalStatus))),
    religion: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfReligion))),
    community: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfCommunity))),
    motherTongue: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfMotherTongue))),
    currentCountry: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfCurrentCountry))),
    state: Joi.array().items(Joi.string().valid(...Object.values(enumModel.EnumOfState))),
    currentCity: Joi.array().items(Joi.string()),
    saveSearch: Joi.string(),
  }),
};

export const getbySearchHistoryId = {
  params: Joi.object().keys({
    SearchHistoryId: Joi.objectId().required(),
  }),
};
export const deletebySearchHistoryId = {
  params: Joi.object().keys({
    SearchHistoryId: Joi.objectId().required(),
  }),
};

export const getbysaveSearch = {
  params: Joi.object().keys({
    saveSearch: Joi.string().required(),
  }),
};

export const getbyuserId = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};
