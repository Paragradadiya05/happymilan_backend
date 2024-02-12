import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
import enumModel from './enum.model';

const UserPartnerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
  },
  age: {
    min: Number,
    max: Number,
  },
  height: {
    min: Number,
    max: Number,
  },
  country: {
    type: String,
    enum: Object.values(enumModel.EnumOfCountry),
  },
  state: {
    type: String,
    enum: Object.values(enumModel.EnumOfState),
  },
  city: {
    type: String,
    enum: Object.values(enumModel.EnumOfCity),
  },
  income: {
    type: String,
  },
  creative: {
    type: String,
    enum: Object.values(enumModel.EnumOfCreative),
  },
  fun: {
    type: String,
  },
  diet: {
    type: String,
    enum: Object.values(enumModel.EnumOfDiet),
  },
});
UserPartnerSchema.plugin(toJSON);
UserPartnerSchema.plugin(mongoosePaginateV2);
const UserPartnerModel = mongoose.models.UserPartner || mongoose.model('UserPartner', UserPartnerSchema, 'UserPartner');
module.exports = UserPartnerModel;
