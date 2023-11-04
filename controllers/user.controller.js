const Joi = require("joi"); // Import Joi for data validation
const bcrypt = require("bcrypt"); // Import bcrypt for password hashing
const jwt = require("jsonwebtoken"); // Import jsonwebtoken for token generation
const User = require("../models/User"); // Import the User model
const Follow = require("../models/Follow")

const BCRYPT_SALTS = Number(process.env.BCRYPT_SALTS); // Load the number of bcrypt salts from environment variables

// POST - Register User
const registerUser = async (req, res) => {
  // Data Validation using Joi
  const isValid = Joi.object({
    name: Joi.string().required(),
    username: Joi.string().min(3).max(25).alphanum().required(),
    password: Joi.string().min(8).required(),
    email: Joi.string().email().required(),
  }).validate(req.body);

  // Check if there are validation errors
  if (isValid.error) {
    return res.status(400).send({
      status: 400,
      message: "Invalid Input",
      data: isValid.error,
    });
  }

  try {
    // Check if a user with the same email or username already exists
    const userExists = await User.find({
      $or: [{ email: req.body.email, username: req.body.username }],
    });

    if (userExists.length != 0) {
      return res.status(400).send({
        status: 400,
        message: "Username/Email already exists",
      });
    }
  } catch (err) {
    // Handle errors that occur while checking for existing users
    return res.status(400).send({
      status: 400,
      message: "Error while checking if username and email exist",
      data: err,
    });
  }

  // Hash the user's password using bcrypt
  const hashedPassword = await bcrypt.hash(req.body.password, BCRYPT_SALTS);

  // Create a User object with the provided user details
  const userObj = new User({
    name: req.body.name,
    username: req.body.username,
    password: hashedPassword,
    email: req.body.email,
  });

  try {
    // Save the user object to the database
    await userObj.save();

    return res.status(201).send({
      status: 201,
      message: "User registered successfully",
    });
  } catch (err) {
    // Handle any errors that occur while saving the user to the database
    return res.status(400).send({
      status: 400,
      message: "Error while saving user to the database",
      data: err,
    });
  }
};





// POST - Login User
const loginUser = async (req, res) => {
    // Extract username and password from the request body
    const { username, password } = req.body;
  
    // Data Validation using Joi
    const isValid = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
    }).validate(req.body);
  
    // Check if there are validation errors
    if (isValid.error) {
      return res.status(400).send({
        status: 400,
        message: "Invalid Username/password",
        data: isValid.error,
      });
    }
  
    let userData;
  
    try {
      // Find a user in the database based on the provided username
      userData = await User.findOne({ username });
  
      // Check if a user with the provided username exists
      if (!userData) {
        return res.status(400).send({
          status: 400,
          message: "No user found! Please register",
        });
      }
    } catch (err) {
      // Handle errors that occur while fetching user data
      return res.status(400).send({
        status: 400,
        message: "Error while fetching user data",
        data: err,
      });
    }
  
    // Compare the provided password with the stored (hashed) password in the database
    const isPasswordSame = await bcrypt.compare(password, userData.password);
  
    // Check if the passwords match
    if (!isPasswordSame) {
      return res.status(400).send({
        status: 400,
        message: "Incorrect Password",
      });
    }
  
    // If the password is correct, create a JSON Web Token (JWT) for the user
    const payload = {
      username: userData.username,
      name: userData.name,
      email: userData.email,
      userId: userData._id,
    };
  
    const token = jwt.sign(payload, process.env.JWT_SECRET); // Sign the token with a secret key
  
    return res.status(200).send({
      status: 200,
      message: "User Logged in successfully",
      data: { token }, // Send the token in the response
    });
  };

  // get all users
  const getAllUsers = async (req, res) => {
    const userId = req.locals.userId;
  
    let usersData;
  
    try {
      usersData = await User.find({ _id: { $ne: userId } });
      console.log("usersData",usersData)
  
      if (!usersData) {
        return res.status(400).send({
          status: 400,
          message: "Failed to fetch all users",
        });
      }
    } catch (err) {
      return res.status(400).send({
        status: 400,
        message: "Failed to fetch all users",
        data: err,
      });
    }
  
    let followingList;
    try {
      followingList = await Follow.find({ currentUserId: userId });
      console.log("hello")
      console.log("followingList",followingList)
    } catch (err) {
      return res.status(400).send({
        status: 400,
        message: "Failed to fetch following users list",
        data: err,
      });
    }
  
    let usersList = [];
  
    let followingMap = new Map();
  
    followingList.forEach((user) => {
      followingMap.set(user.followingUserId, true);
    });
  
    usersData.forEach((user) => {
      if (followingMap.get(user._id.toString())) {
        let userObj = {
          name: user.name,
          username: user.username,
          email: user.email,
          _id: user._id,
          follow: true,
        };
  
        usersList.push(userObj);
      } else {
        let userObj = {
          name: user.name,
          username: user.username,
          email: user.email,
          _id: user._id,
          follow: false,
        };
  
        usersList.push(userObj);
      }
    });
  
    return res.status(200).send({
      status: 200,
      message: "All users fetched succesfully",
      data: usersList,
    });
  };
  

// Export the registerUser function for use in your application
module.exports = {registerUser,loginUser,getAllUsers };


    
















