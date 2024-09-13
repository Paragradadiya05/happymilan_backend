import express from 'express';
import auth from 'middlewares/auth';
import validate from 'middlewares/validate';
import { s3Controller } from 'controllers/common';
import { s3Validation } from 'validations/common';

const router = express();
/**
 * Create pre-signed url Api
 * */
router.post('/presignedurl', auth(), validate(s3Validation.preSignedPutUrl), s3Controller.preSignedPutUrl);

router.post('/presignedurlv2', auth(), validate(s3Validation.preSignedPutUrlv2), s3Controller.preSignedPutUrlv2);

router.post('/uploadkycdoc', auth(), validate(s3Validation.UploadKycDoc), s3Controller.UploadKycDoc);

router.post('/uploadstoryimage', auth(), validate(s3Validation.UploadStoryImg), s3Controller.UploadStoryImg);

router.post('/send-proposal', validate(s3Validation.sendProposal), s3Controller.sendProposal);

module.exports = router;
