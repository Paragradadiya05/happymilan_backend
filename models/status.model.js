import mongoose from 'mongoose';
import { toJSON } from 'models/plugins';

const StatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: {
      type: String,
    },
    statusAddTime: {
      type: Date,
      default: Date.now,
    },
    statusEndTime: {
      type: Date,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
StatusSchema.plugin(toJSON);

StatusSchema.post(
  ['find', 'findOne', 'findOneAndDelete', 'findOneAndRemove', 'update', 'updateOne', 'updateMany'],
  function (result, next) {
    const currentTime = new Date();
    if (result && result.statusEndTime && result.statusEndTime < currentTime) {
      // eslint-disable-next-line no-param-reassign
      result = null;
    }
    next(null, result);
  }
);
StatusSchema.pre('find', function () {
  const currentTime = new Date();
  this.where({ statusEndTime: { $gte: currentTime } });
});
StatusSchema.pre('save', function (next) {
  const oneDayAfter = new Date(this.statusAddTime);
  oneDayAfter.setDate(oneDayAfter.getDate() + 1);
  this.statusEndTime = oneDayAfter;
  next();
});

const StatusModel = mongoose.models.Status || mongoose.model('Status', StatusSchema, 'Status');
module.exports = StatusModel;
