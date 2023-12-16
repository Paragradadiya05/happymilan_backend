import express from 'express';
import validate from 'middlewares/validate';
import { pofileviewerController } from 'controllers/user';
import { profileviewerValidation } from 'validations/user';
import auth from 'middlewares/auth';

const router = express();
router.post(
  '/create-profile-viewer',
  auth(),
  validate(profileviewerValidation.createProfileviwer),
  pofileviewerController.createProfileViwer
);

router.get(
  '/getprofileviewer/:userId',
  auth(),
  validate(profileviewerValidation.GetProfileviwer),
  pofileviewerController.getprofileviewer
);

module.exports = router;
