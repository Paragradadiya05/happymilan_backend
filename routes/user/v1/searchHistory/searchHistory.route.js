import express from 'express';
import { searchHistoryController } from 'controllers/user';
import { searchHistoryValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createSearchHistory
   * */
  .post(auth(), validate(searchHistoryValidation.createSearchHistory), searchHistoryController.createSearchHistory)
  /**
   * getSearchHistory
   * */
  .get(auth(), validate(searchHistoryValidation.getSearchHistory), searchHistoryController.listSearchHistory);
export default router;
