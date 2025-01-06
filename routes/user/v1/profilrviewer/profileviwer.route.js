import express from 'express';
import validate from 'middlewares/validate';
import { pofileviewerController } from 'controllers/user';
import { profileviewerValidation } from 'validations/user';
import auth from 'middlewares/auth';
import appUserType from '../../../../middlewares/appUserType';

const router = express();
router.post(
  '/create-profile-viewer',
  auth(),
  validate(profileviewerValidation.createProfileviwer),
  pofileviewerController.createProfileViwer
);

router.get(
  '/get-profile-viewer/:userId',
  auth(),
  validate(profileviewerValidation.GetProfileviwer),
  pofileviewerController.getProfileViewer
);
router.get(
  '/get-profile-viewerV2/:userId',
  auth(),
  validate(profileviewerValidation.GetProfileviwer),
  pofileviewerController.getProfileViewerV2
);
router.get(
  '/get-profile-viewer-mobile/:userId',
  auth(),
  appUserType(),
  validate(profileviewerValidation.GetProfileviwer),
  pofileviewerController.GetProfileviwerMobile
);
module.exports = router;
