import mongoose from 'mongoose';

const { Schema } = mongoose;
const tempS3Schemav2 = new Schema(
  {
    name: String,
    url: String,
    key: String,
    fields: {
      ContentType: String,
      key: String,
      bucket: String,
      XAmzAlgorithm: String,
      XAmzCredential: String,
      XAmzDate: String,
      Policy: String,
      XAmzSignature: String,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const TempS3v2 = mongoose.models.TempS3 || mongoose.model('TempS3', tempS3Schemav2);
module.exports = TempS3v2;
