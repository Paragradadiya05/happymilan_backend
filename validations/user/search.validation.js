import Joi from 'joi';
import enumFields from '../../models/enum.model';

export const searchAge = {
  body: Joi.object().keys({
    minAge: Joi.number(),
    maxAge: Joi.number(),
    maritalStatus: Joi.string().valid(...Object.values(enumFields.EnumOfMaritalStatus)),
    religion: Joi.string().valid(...Object.values(enumFields.EnumOfReligion)),
    community: Joi.string().valid(...Object.values(enumFields.EnumOfCommunity)),
    motherTongue: Joi.string().valid(...Object.values(enumFields.EnumOfMotherTongue)),
  }),
};

export const update = {
  params: Joi.object().keys({}),
};
