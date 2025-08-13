import Joi from 'joi';
import enumFields, {
  EnumAppUsesTypeOfUsers,
  EnumCreatingProfileFor,
  EnumGenderOfUsers,
  EnumOfCurrentCountry,
  EnumOfGothra,
  EnumOflanguage,
  EnumOfManglikStatus,
  EnumOfMaritalStatus,
  EnumOfMotherTongue,
  EnumOfZodiac,
} from 'models/enum.model';

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
    employId: Joi.string(),
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
    employId: Joi.string(),
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
    emailVerified: Joi.bool(),
    generalDetails: Joi.object()
      .keys({
        creatingProfileFor: Joi.string()
          .valid(...Object.values(EnumCreatingProfileFor))
          .required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        gender: Joi.string()
          .valid(...Object.values(EnumGenderOfUsers))
          .required(),
        maritalStatus: Joi.string()
          .valid(...Object.values(EnumOfMaritalStatus))
          .required(),
        manglikStatus: Joi.string()
          .valid(...Object.values(EnumOfManglikStatus))
          .required(),
        gothra: Joi.string()
          .valid(...Object.values(EnumOfGothra))
          .required(),
        zodiac: Joi.string()
          .valid(...Object.values(EnumOfZodiac))
          .required(),
        motherTongue: Joi.string()
          .valid(...Object.values(EnumOfMotherTongue))
          .required(),
        dateOfBirth: Joi.date().required(),
        birthTime: Joi.date().required(),
        religion: Joi.string().required(),
        caste: Joi.string().allow(null, ''),
        height: Joi.number().required(),
        weight: Joi.number().required(),
      })
      .required(),

    address: Joi.object()
      .keys({
        currentState: Joi.string().required(),
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
    language: Joi.array()
      .items(Joi.string().valid(...Object.values(EnumOflanguage)))
      .required(),
  }),
};

export const dashboard = {
  params: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};

export const updateUserWithAllModelData = {
  body: Joi.object().keys({
    generalDetails: Joi.object().keys({
      firstName: Joi.string(),
      lastName: Joi.string(),
      gender: Joi.string().valid(...Object.values(EnumGenderOfUsers)),
      dateOfBirth: Joi.date(),
      birthTime: Joi.string(),
      religion: Joi.string(),
      caste: Joi.string().allow(null, ''),
      height: Joi.number(),
      weight: Joi.number(),
    }),
    address: Joi.object().keys({
      currentResidenceAddress: Joi.string(),
      currentCity: Joi.string(),
      currentCountry: Joi.string().valid(...Object.values(EnumOfCurrentCountry)),
    }),
    contactDetails: Joi.object().keys({
      mobileNumber: Joi.number(), // todo : add num validation here
      homeMobileNumber: Joi.number().allow(null, ''),
      email: Joi.string().email(),
    }),
    eductionDetails: Joi.object().keys({
      degree: Joi.string(),
      collage: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
    }),
    professionalDetails: Joi.object().keys({
      companyName: Joi.string(),
      jobTitle: Joi.string(),
      jobType: Joi.string().valid('Full-time', 'Part-time', 'Contract', 'Internship'),
      currentSalary: Joi.number(),
      workCity: Joi.string(),
      workCountry: Joi.string(),
    }),
    hobbies: Joi.array().items(Joi.string()),
  }),
};

export const resetUserCredits = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    reason: Joi.string().optional().min(3).max(100),
  }),
};

export const resetMultipleUserCredits = {
  body: Joi.object().keys({
    userIds: Joi.array().items(Joi.objectId()).min(1).max(100).required(),
    reason: Joi.string().optional().min(3).max(100),
  }),
};
