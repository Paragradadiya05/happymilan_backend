import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { softDelete, toJSON } from 'models/plugins';
import enumModel, { EnumOfPlatformType } from 'models/enum.model';
import bcrypt from 'bcryptjs';

const CodeSchema = new mongoose.Schema({
  code: {
    type: String,
  },
  expirationDate: {
    type: Date,
  },
  used: {
    type: Boolean,
  },
  codeType: {
    type: String,
    enum: Object.values(enumModel.EnumCodeTypeOfCode),
  },
});

const OauthSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  token: {
    type: String,
  },
});

const DeviceTokenSchema = new mongoose.Schema({
  /**
   *Device Token Of User
   * */
  deviceToken: {
    type: String,
  },
  /**
   *Platform of User
   * */
  platform: {
    type: String,
    enum: Object.values(enumModel.EnumPlatformOfDeviceToken),
  },
});

const UserImagesSchema = new mongoose.Schema(
  {
    url: {
      type: String,
    },
    name: {
      type: String,
    },
    isDeleted: Boolean,
    deleted: Boolean,
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
const UserVideoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
    },
    name: {
      type: String,
    },
    isDeleted: Boolean,
    deleted: Boolean,
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

const ProfileHideAndDelete = new mongoose.Schema(
  {
    isProfileHide: {
      type: Boolean,
      default: false,
    },
    timeForProfileHide: {
      type: Date,
    },
    isProfileDelete: {
      type: Boolean,
      default: false,
    },
    reasonForProfileDelete: {
      type: String,
      enum: Object.values(enumModel.EnumOfReasonForProfileDelete),
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
const datingData = new mongoose.Schema(
  {
    interestedIn: {
      type: [String],
      enum: Object.values(enumModel.EnumOfInterest),
    },
    Ethnicity: {
      type: String,
    },
    educationLevel: {
      type: String,
    },
    CurrentlyLiving: {
      type: String,
    },
    Occupation: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
// todo : updated in new flow.
// const hobbiesSchema = new mongoose.Schema({
//   category: {
//     type: String,
//     required: true,
//   },
//   values: {
//     type: [String],
//     required: true,
//   },
// });
const UserSchema = new mongoose.Schema(
  {
    /**
     * Name of User
     * */
    name: {
      type: String,
    },
    /**
     * Email address of User
     * */
    email: {
      type: String,
      // eslint-disable-next-line security/detect-unsafe-regex
      match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
    },
    mobileNumber: {
      type: Number,
    },
    /**
     * For email verification
     * */
    emailVerified: {
      type: Boolean,
      private: true,
    },
    /**
     * role
     * */
    // role: {
    //   //  add role id
    //   type: String,
    //   enum: Object.values(enumModel.EnumRoleOfUser),
    //   default: enumModel.EnumRoleOfUser.USER,
    // },
    // todo : we have to add user model when user is created.
    //  default schema model in db. also make migration for stag existing data
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },
    /**
     * custom server authentication
     * */
    codes: {
      type: [CodeSchema],
    },
    /**
     * password for authentication
     * */
    password: {
      type: String,
      private: true,
    },
    /**
     * facebook based authentication
     * */
    facebookProvider: {
      type: OauthSchema,
    },
    /**
     * Google based authentication
     * */
    googleProvider: {
      type: OauthSchema,
    },
    /**
     * apple based authentication
     * */
    appleProvider: {
      type: OauthSchema,
    },
    /**
     * To store device tokens
     * */
    deviceTokens: {
      type: [DeviceTokenSchema],
    },
    /**
     * github based authentication
     * */
    githubProvider: {
      type: OauthSchema,
    },
    displayName: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    nickName: {
      type: String,
    },
    gender: {
      type: String,
      enum: Object.values(enumModel.EnumGenderOfUsers),
    },
    dateOfBirth: {
      type: Date,
    },
    randomId: {
      type: String,
    },
    birthTime: {
      type: Date,
    },
    religion: {
      type: String,
      enum: Object.values(enumModel.EnumOfReligion),
    },
    caste: {
      type: String,
    },
    ShortBio: {
      type: String,
    },
    appUsesType: {
      type: String,
      enum: Object.values(enumModel.EnumAppUsesTypeOfUsers),
    },
    hobbies: [String], // todo : this is changed in new flow. so we can remove old flow for now.
    interest: {
      type: String,
    },
    homeMobileNumber: {
      type: Number,
    },
    creatingProfileFor: {
      type: String,
      enum: Object.values(enumModel.EnumCreatingProfileFor),
    },
    writeBoutYourSelf: {
      type: String,
    },
    isProfileVisible: {
      type: Boolean,
      default: true,
    },
    maritalStatus: {
      type: String,
      enum: Object.values(enumModel.EnumOfMaritalStatus),
    },
    hideProfileDuration: {
      type: Date,
    },
    userProfileCompleted: {
      type: Boolean,
      default: false,
    },
    community: {
      type: String,
      enum: Object.values(enumModel.EnumOfCommunity),
    },
    motherTongue: {
      type: String,
      enum: Object.values(enumModel.EnumOfMotherTongue),
    },
    // creative: {
    //   type: String,
    // },
    // fun: {
    //   type: String,
    // },
    // fitness: {
    //   type: String,
    // },
    age: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    height: {
      type: Number,
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },
    userPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserPartner',
    },
    userEducation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserEducation',
    },
    userProfessional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfessionalDetail',
    },
    profilePic: {
      type: String,
    },
    shortBio: {
      type: String,
    },
    userUniqueId: {
      type: String,
    },
    diet: {
      type: String,
      enum: Object.values(enumModel.EnumOfDiet),
    },
    userProfilePic: [UserImagesSchema],
    userProfileVideo: [UserVideoSchema],
    profileHideAndDelete: [ProfileHideAndDelete],
    datingData: [datingData],
    platform: {
      type: String,
      enum: Object.values(enumModel.EnumOfPlatformType),
      default: EnumOfPlatformType.HAPPY_MILAN,
    },
    isUserActive: {
      type: Boolean,
      default: false,
    },
    /**
     * created By
     * */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    /**
     * updated By
     * */
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
  },

  { timestamps: { createdAt: true, updatedAt: true } }
);
UserSchema.plugin(toJSON);
UserSchema.plugin(mongoosePaginateV2);
UserImagesSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});
/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the User to be excluded
 * @returns Promise with boolean value
 */

UserSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const User = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!User;
};
UserSchema.pre('save', async function (next) {
  const User = this;
  if (User.isModified('password')) {
    User.password = await bcrypt.hash(User.password, 8);
  }
  next();
});
/**
 * When user reset password or change password then it save in bcrypt format
 */
UserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate(); // {password: "..."}
  if (update && update.password) {
    const passwordHash = await bcrypt.hash(update.password, 10);
    this.setUpdate({
      $set: {
        password: passwordHash,
      },
    });
  }
  next();
});

UserSchema.post(
  ['find', 'findOne', 'findOneAndDelete', 'findOneAndRemove', 'update', 'updateOne', 'updateMany'],
  function (result, next) {
    if (result && result.userProfilePic && result.userProfilePic.length) {
      // eslint-disable-next-line no-param-reassign
      result.userProfilePic = result.userProfilePic.filter((doc) => !doc.isDeleted);
    }

    // If you want to include deleted images, you can use a flag 'includeDeleted'
    if (!this._mongooseOptions.includeDeleted) {
      if (result && result.userProfilePic && result.userProfilePic.length) {
        // eslint-disable-next-line no-param-reassign
        result.userProfilePic = result.userProfilePic.filter((doc) => !doc.deleted);
      }
    }

    next(null, result);
  }
);
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema, 'User');
module.exports = UserModel;
