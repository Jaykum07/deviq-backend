const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');


const app = express();

//security headers
app.use(helmet());

//cors - allow react frontend to call this API
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:3000',
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
const errorHandler = require('./middleware/errorHandler');
//routes
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/history', historyRoutes);

// 404 handler
// app.use('*', (req, res) =>{
//     res.status(404).json({
//         success: false,
//         message: `Route ${req.originalUrl} not found`,
//     });
// });

app.use(errorHandler);

module.exports = app;

