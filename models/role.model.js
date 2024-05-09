import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
import enumModel from './enum.model';

// Define a schema for access permissions
const accessSchema = new mongoose.Schema({
  view: { type: Boolean, default: false },
  add: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
});

const RoleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: Object.values(enumModel.EnumRoleOfUser),
      default: enumModel.EnumRoleOfUser.USER,
      unique: true,
      required: true,
    },
    dashboard: accessSchema,
    plans: accessSchema,
    emailMarketing: accessSchema,
    paymentAndReceipts: accessSchema,
    User: accessSchema,
    blogs: accessSchema,
    roles: accessSchema,
    successStories: accessSchema,
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
RoleSchema.plugin(toJSON);
RoleSchema.plugin(mongoosePaginateV2);
const RoleModel = mongoose.models.Role || mongoose.model('Role', RoleSchema, 'Role');
module.exports = RoleModel;
