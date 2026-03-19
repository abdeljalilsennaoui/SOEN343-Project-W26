const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const AnalyticsListener = require('./services/AnalyticsListener');

// Register analytics observer before any routes are mounted
AnalyticsListener.register();

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;
