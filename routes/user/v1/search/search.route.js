import express from 'express';
import { searchController } from 'controllers/user';
import auth from 'middlewares/auth';
import validate from 'middlewares/validate';
import { searchValidation } from 'validations/user';
import appUserType from '../../../../middlewares/appUserType';

const router = express();

router.post('/search-user', auth(), appUserType(), validate(searchValidation.searchUser), searchController.searchUser);

router.post(
  '/search-user-dating',
  auth(),
  appUserType(),
  validate(searchValidation.searchUser),
  searchController.searchUserDating
);

module.exports = router;
