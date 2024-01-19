import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
import enumModel from './enum.model';

const RoleSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      enum: Object.values(enumModel.EnumOfUser),
      required: true,
    },
    dashboard: {
      type: Boolean,
      default: false,
    },
    plans: {
      type: Boolean,
      default: false,
    },
    emailMarketing: {
      type: Boolean,
      default: false,
    },
    paymentAndReceipts: {
      type: Boolean,
      default: false,
    },
    User: {
      type: Boolean,
      default: false,
    },
    blogs: {
      type: Boolean,
      default: false,
    },
    roles: {
      type: Boolean,
      default: false,
    },
    successStories: {
      type: Boolean,
      default: false,
    },
    new: {
      type: Boolean,
      default: false,
    },
    edit: {
      type: Boolean,
      default: false,
    },
    view: {
      type: Boolean,
      default: false,
    },
    delete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
RoleSchema.plugin(toJSON);
RoleSchema.plugin(mongoosePaginateV2);
const RoleModel = mongoose.models.Role || mongoose.model('Role', RoleSchema, 'Role');
module.exports = RoleModel;
