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
router
  .route('/:SearchHistoryId')
  /**
   * getbySearchHistoryId
   * */
  .get(auth(), validate(searchHistoryValidation.getbySearchHistoryId), searchHistoryController.getbySearchHistoryId)
  /**
   * deletebySearchHistoryId
   * */
  .delete(
    auth(),
    validate(searchHistoryValidation.deletebySearchHistoryId),
    searchHistoryController.deletebySearchHistoryId
  );
router
  .route('/saveSearch/:saveSearch')
  /**
   * getbysaveSearch
   * */
  .get(auth(), validate(searchHistoryValidation.getbysaveSearch), searchHistoryController.getbysaveSearch);

export default router;
