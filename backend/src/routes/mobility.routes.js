const { Router } = require('express');
const mobilityController = require('../mvc/MobilityController');
const { validateQuery, mobilitySearchSchema } = require('../middleware/validation');

const router = Router();

router.get(
  '/mobility/options/search',
  validateQuery(mobilitySearchSchema),
  mobilityController.searchOptions.bind(mobilityController),
);

module.exports = router;
