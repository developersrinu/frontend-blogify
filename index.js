//packages
const express = require('express')
require('dotenv').config();
const cors = require('cors')

//file import--------------------------
const db = require('./config/db')
const userRoutes = require('./routes/user')
const blogRoutes = require('./routes/blog')
const followRoutes = require("./routes/follow")
const { cleanUpBin } = require("./utils/cron");



const app = express();
const port = process.env.PORT



//middleWares---------------------------
app.use(express.json())
app.use(
    cors({
      origin: "*",
      methods: 'GET,POST,PUT,DELETE',
      credentials: true,
    })
);




//-------------routes------------------
app.use("/user", userRoutes);
app.use("/blog", blogRoutes)
app.use('/follow', followRoutes)





//---------server---------------------
app.listen(port, () => {
    console.log('Server is running at port', port)
    cleanUpBin();
});
