const dotenv = require('dotenv');
const connectDB = require('./src/config/db')

dotenv.config();

connectDB();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(3000, ()=> {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})


