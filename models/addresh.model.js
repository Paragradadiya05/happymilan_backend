import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const AddreshSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    currentResidenceAddresh: {
      type: String,
    },
    currentCity: {
      type: String,
    },
    currentCountry: {
      type: String,
    },
    originResidenceAddresh: {
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
AddreshSchema.plugin(toJSON);
AddreshSchema.plugin(mongoosePaginateV2);
const AddreshModel = mongoose.models.Addresh || mongoose.model('Addresh', AddreshSchema, 'Addresh');
module.exports = AddreshModel;
