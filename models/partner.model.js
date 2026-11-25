import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
import enumModel from './enum.model';

// todo : add unique in user partner in userid
const UserPartnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      unique: true,
    },
    age: {
      min: Number,
      max: Number,
    },
    height: {
      min: Number,
      max: Number,
    },
    weight: {
      min: Number,
      max: Number,
    },
    income: {
      min: Number,
      max: Number,
    },
    religion: {
      type: [String],
      enum: Object.values(enumModel.EnumOfReligion),
    },
    caste: {
      type: [String],
    },
    cast: {
      type: [String],
    },
    country: {
      type: [String],
      enum: Object.values(enumModel.EnumOfCountry),
    },
    state: {
      type: [String],
      enum: Object.values(enumModel.EnumOfState),
    },
    city: {
      type: [String],
    },
    hobbies: {
      type: [String],
    },
    diet: {
      type: [String],
      enum: Object.values(enumModel.EnumOfDiet),
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
UserPartnerSchema.pre('save', function (next) {
  if (this.cast && (!this.caste || !this.caste.length)) {
    this.caste = this.cast;
  } else if (this.caste && (!this.cast || !this.cast.length)) {
    this.cast = this.caste;
  }
  next();
});

UserPartnerSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    const data = update.$set || update;
    if (data.cast && (!data.caste || !data.caste.length)) {
      data.caste = data.cast;
    } else if (data.caste && (!data.cast || !data.cast.length)) {
      data.cast = data.caste;
    }
  }
  next();
});

UserPartnerSchema.plugin(toJSON);
UserPartnerSchema.plugin(mongoosePaginateV2);
const UserPartnerModel = mongoose.models.UserPartner || mongoose.model('UserPartner', UserPartnerSchema, 'UserPartner');
module.exports = UserPartnerModel;
