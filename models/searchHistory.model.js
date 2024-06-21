import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
import enumModel from './enum.model';

const SearchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    minAge: {
      min: Number,
      max: Number,
    },
    height: {
      min: Number,
      max: Number,
    },
    maritalStatus: {
      type: [String],
      enum: Object.values(enumModel.EnumOfMaritalStatus),
    },
    religion: {
      type: [String],
      enum: Object.values(enumModel.EnumOfReligion),
    },
    community: {
      type: [String],
      enum: Object.values(enumModel.EnumOfCommunity),
    },
    motherTongue: {
      type: [String],
      enum: Object.values(enumModel.EnumOfMotherTongue),
    },
    currentCountry: {
      type: [String],
      enum: Object.values(enumModel.EnumOfCurrentCountry),
    },
    currentCity: {
      type: [String],
    },
    state: {
      type: [String],
      enum: Object.values(enumModel.EnumOfState),
    },
    weight: {
      type: Number,
    },
    saveSearch: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
SearchHistorySchema.plugin(toJSON);
SearchHistorySchema.plugin(mongoosePaginateV2);
const SearchHistoryModel = mongoose.models.Search || mongoose.model('Search', SearchHistorySchema, 'Search');
module.exports = SearchHistoryModel;
