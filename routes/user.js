const express = require("express");
const app = express();
const { isAuth } = require("../middlewares/AuthMiddleware");
const {registerUser,loginUser,getAllUsers} = require('../controllers/user.controller')

app.post("/register",registerUser);
app.post('/login',loginUser)
app.get('/get-all-users',isAuth, getAllUsers);
module.exports = app;