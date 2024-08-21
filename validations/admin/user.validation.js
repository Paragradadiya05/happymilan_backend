import Joi from 'joi';
import enumFields, { EnumAppUsesTypeOfUsers, EnumGenderOfUsers, EnumOfCurrentCountry } from 'models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

const codesEmbed = Joi.object().keys({
  code: Joi.string(),
  expirationDate: Joi.date(),
  used: Joi.bool(),
  codeType: Joi.string().valid(...Object.values(enumFields.EnumCodeTypeOfCode)),
});
const facebookProviderEmbed = Joi.object().keys({
  id: Joi.string(),
  token: Joi.string(),
});
const googleProviderEmbed = Joi.object().keys({
  id: Joi.string(),
  token: Joi.string(),
});
const appleProviderEmbed = Joi.object().keys({
  id: Joi.string(),
  token: Joi.string(),
});
const githubProviderEmbed = Joi.object().keys({
  id: Joi.string(),
  token: Joi.string(),
});
export const createUser = {
  body: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string().email(),
    role: Joi.objectId().required(),
    codes: Joi.array().items(codesEmbed),
    password: Joi.string(),
    facebookProvider: facebookProviderEmbed,
    googleProvider: googleProviderEmbed,
    appleProvider: appleProviderEmbed,
    githubProvider: githubProviderEmbed,
  }),
};

export const updateUser = {
  body: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string().email(),
    role: Joi.string().valid(...Object.values(enumFields.EnumRoleOfUser)),
    codes: Joi.array().items(codesEmbed),
    password: Joi.string(),
    facebookProvider: facebookProviderEmbed,
    googleProvider: googleProviderEmbed,
    appleProvider: appleProviderEmbed,
    githubProvider: githubProviderEmbed,
  }),
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const getUserById = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const deleteUserById = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const getUser = {
  body: Joi.object().keys({}).unknown(true),
};

export const paginatedUser = {
  body: Joi.object().keys({}).unknown(true),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};

export const createUserWithAllModelData = {
  body: Joi.object().keys({
    generalDetails: Joi.object()
      .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        gender: Joi.string()
          .valid(...Object.values(EnumGenderOfUsers))
          .required(),
        dateOfBirth: Joi.date().required(),
        birthTime: Joi.string().required(),
        religion: Joi.string().required(),
        caste: Joi.string().allow(null, ''),
        height: Joi.number().required(),
        weight: Joi.number().required(),
      })
      .required(),

    address: Joi.object()
      .keys({
        currentResidenceAddress: Joi.string().required(),
        currentCity: Joi.string().required(),
        currentCountry: Joi.string()
          .valid(...Object.values(EnumOfCurrentCountry))
          .required(),
      })
      .required(),

    contactDetails: Joi.object()
      .keys({
        mobileNumber: Joi.number().required(), // todo : add num validation here
        homeMobileNumber: Joi.number().required().allow(null, ''),
        email: Joi.string().email().required(),
      })
      .required(),

    eductionDetails: Joi.object()
      .keys({
        degree: Joi.string().required(),
        collage: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
      })
      .required(),

    professionalDetails: Joi.object()
      .keys({
        companyName: Joi.string().required(),
        jobTitle: Joi.string().required(),
        jobType: Joi.string().valid('Full-time', 'Part-time', 'Contract', 'Internship').required(),
        currentSalary: Joi.number().required(),
        workCity: Joi.string().required(),
        workCountry: Joi.string().required(),
      })
      .required(),
    hobbies: Joi.array().items(Joi.string()).required(),
  }),
};

export const dashboard = {
  params: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};
