import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from './plugins';
import enumModel from './enum.model';

const OffersSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(enumModel.EnumOfOffer),
    },
    name: {
      type: String,
    },
    details: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    other: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
OffersSchema.plugin(toJSON);
OffersSchema.plugin(mongoosePaginateV2);

const OfferModel = mongoose.models.Offer || mongoose.model('Offer', OffersSchema, 'Offer');
module.exports = OfferModel;
