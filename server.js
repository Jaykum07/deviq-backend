const dotenv = require('dotenv');
const connectDB = require('./src/config/db')
const validateEnv = require('./src/config/env');

dotenv.config();
validateEnv();
connectDB();

const app = require('./src/app');


const PORT = process.env.PORT || 5000;

app.listen(5000, ()=> {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})


