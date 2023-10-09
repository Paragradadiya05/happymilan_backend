import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const AddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    currentResidenceAddress: {
      type: String,
    },
    currentCity: {
      type: String,
    },
    currentCountry: {
      type: String,
    },
    originResidenceAddress: {
      type: String,
    },
    originCity: {
      type: String,
    },
    originCountry: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
AddressSchema.plugin(toJSON);
AddressSchema.plugin(mongoosePaginateV2);
const AddressModel = mongoose.models.Address || mongoose.model('Address', AddressSchema, 'Address');
module.exports = AddressModel;
