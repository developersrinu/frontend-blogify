const joi = require('joi');
const User = require('../models/User');
const Follow = require("../models/Follow");

// Function to follow a user
const followUser = async (req, res) => {
  // Extract the current user's ID from the request
  const currentUserId = req.locals.userId;
  
  // Extract the ID of the user to follow from the request body
  const { followingUserId } = req.body;


  // Validate the request body using Joi
  const isValid = joi.object({
    followingUserId: joi.string().required(),
  }).validate(req.body);

  // Check if the request body is invalid, and if so, send an error response
  if (isValid.error) {
    return res.status(400).send({
      status: 400,
      message: "Invalid UserId",
      data: isValid.error,
    });
  }

  // Verify that the user to follow exists
  let followingUserData;
  try {
    followingUserData = await User.findById(followingUserId);

    // If the user doesn't exist, send an error response
    if (!followingUserData) {
      return res.status(400).send({
        status: 400,
        message: "User doesn't exist",
      });
    }
  } catch (err) {
    return res.status(400).send({
      status: 400,
      message: "Failed to fetch user data",
      data: err,
    });
  }

  // Check if the current user already follows the followingUser
  try {
    const followObj = await Follow.findOne({ currentUserId, followingUserId });

    // If a follow relationship already exists, send an error response
    if (followObj) {
      return res.status(400).send({
        status: 400,
        message: "User already follows",
      });
    }
  } catch (err) {
    return res.status(400).send({
      status: 400,
      message: "Failed to fetch follow object",
      data: err,
    });
  }

  // Create a new follow object and save it to the database
  const followObj = new Follow({
    currentUserId,
    followingUserId,
    creationDateTime: Date.now(),
  });

  try {
    await followObj.save();
    res.status(201).send({
      status: 201,
      message: "Followed successfully",
    });
  } catch (err) {
    return res.status(400).send({
      status: 400,
      message: "Failed to add follow object",
      data: err,
    });
  }
};

// Function to unfollow a user
const unfollowUser = async (req, res) => {
  const currentUserId = req.locals.userId;
  const { followingUserId } = req.body;

  const isValid = joi.object({
    followingUserId: joi.string().required(),
  }).validate(req.body);

  if (isValid.error) {
    return res.status(400).send({
      status: 400,
      message: "Invalid UserId",
      data: isValid.error,
    });
  }

  // Verify that the user to unfollow exists
  let followingUserData;
  try {
    followingUserData = await User.findById(followingUserId);

    if (!followingUserData) {
      return res.status(400).send({
        status: 400,
        message: "User doesn't exist",
      });
    }
  } catch (err) {
    return res.status(400).send({
      status: 400,
      message: "Failed to fetch user data",
      data: err,
    });
  }

  // Check if the current user already follows the followingUser
  try {
    const followObj = await Follow.findOne({ currentUserId, followingUserId });

    // If there's no follow relationship, send an error response
    if (!followObj) {
      return res.status(400).send({
        status: 400,
        message: "You don't follow this user",
      });
    }
  } catch (err) {
    return res.status(400).send({
      status: 400,
      message: "Failed to fetch follow object",
      data: err,
    });
  }

  // Unfollow the user by deleting the follow object
  try {
    await Follow.findOneAndDelete({ currentUserId, followingUserId });

    return res.status(200).send({
      status: 200,
      message: "Unfollowed successfully",
    });
  } catch (err) {
    return res.status(400).send({
      status: 400,
      message: "Failed to unfollow user",
      data: err,
    });
  }
};

module.exports = { followUser, unfollowUser };

