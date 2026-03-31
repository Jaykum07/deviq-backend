const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');


const app = express();

//security headers
app.use(helmet());

//cors - allow react frontend to call this API
app.use(cors({
    origin: "http://localhost:5173", // React dev server
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

//body parsers
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true}));

//request logger (dev only)
if(process.env.NODE_ENV === 'developement'){
    app.use(morgan('dev'));
}

const authRoutes = require('./routes/auth.routes');
const githubRoutes = require('./routes/github.routes');
const historyRoutes = require('./routes/history.routes');
const compareRoutes = require('./routes/compare.routes');
const reportRoutes = require('./routes/report.routes')
const errorHandler = require('./middleware/errorHandler');

//routes
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/reports', reportRoutes);


app.use(errorHandler);

module.exports = app;

