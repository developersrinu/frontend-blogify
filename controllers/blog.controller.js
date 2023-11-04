// Import necessary modules and models
const Joi = require("joi");
const Blog = require("../models/Blog");
const Follow = require('../models/Follow')


// Create a new blog
const createBlog = async (req, res) => {
    // Validate the request body using Joi to ensure it matches the expected format
    const isValid = Joi.object({
        title: Joi.string().required(),
        textBody: Joi.string().min(30).max(1000).required(),
    }).validate(req.body);

    // If validation fails, send a 400 Bad Request response with error details
    if (isValid.error) {
        return res.status(400).send({
            status: 400,
            message: "Invalid Input",
            data: isValid.error,
        });
    }

    // Extract title and textBody from the request body
    const { title, textBody } = req.body;

    // Create a new Blog object with provided data
    const blogObj = new Blog({
        title,
        textBody,
        creationDateTime: new Date(),
        username: req.locals.username,
        userId: req.locals.userId,
    });

    try {
        // Save the new blog in the database
        await blogObj.save();

        // Send a 201 Created response to indicate successful creation
        res.status(201).send({
            status: 201,
            message: "Blog created successfully",
        });
    } catch (err) {
        // If an error occurs during the database operation, send a 400 Bad Request response with error details
        return res.status(400).send({
            status: 400,
            message: "Failed to create a blog",
            data: err,
        });
    }
};

// Get blogs of a specific user
// const getUserBlogs = async (req, res) => {
//     // Extract the user's ID from req.locals, and optionally, the page number from the query parameters
//     const userId = req.locals.userId;
//     console.log(userId)
//     const page = Number(req.query.page)||1;
//     const LIMIT = 10;

//     if (isNaN(page) || page < 1) {
//         return res.status(400).send({
//             status: 400,
//             message: "Invalid page number",
//         });
//     }

//     let blogData;

//     try {
//         // Retrieve user's blogs from the database, sorted by creation date, paginated
//         blogData = await Blog.find({ userId })
//             .sort({ creationDateTime: -1 })
//             .skip((page - 1) * LIMIT)
//             .limit(LIMIT);
//         console.log(blogData)
//     } catch (err) {
//         // Handle errors in case of a database query issue
//         return res.status(400).send({
//             status: 400,
//             message: "Failed to fetch user blogs",
//             data: err,
//         });
//     }

//     // Send a 200 OK response with the retrieved blog data
//     res.status(200).send({
//         status: 200,
//         message: "Fetched user blogs successfully",
//         data: blogData,
//     });
// };
const getUserBlogs = async (req, res) => {
    const userId = req.locals.userId;
    const page = Number(req.query.page) || 1;
    const LIMIT = 10;
  
    let blogData;
  
    try {
      blogData = await Blog.find({ userId, isDeleted: false })
        .sort({ creationDateTime: -1 })
        .skip((page - 1) * LIMIT)
        .limit(LIMIT);
    } catch (err) {
      return res.status(400).send({
        status: 400,
        message: "Failed to fetch user blogs",
        data: err,
      });
    }
  
    res.status(200).send({
      status: 200,
      message: "Fetched user blogs successfully",
      data: blogData,
    });
  };

// Delete a specific blog of the user
const deleteBlog = async (req, res) => {
    // Extract the user's ID and the blog ID from request parameters
    const userId = req.locals.userId;
    const blogId = req.params.blogId;


    let blogData;

    try {
        // Find the blog by its ID in the database
        blogData = await Blog.findById(blogId);
        console.log(" blogData", blogData)

        // Check if the blog exists
        if (!blogData) {
            return res.status(404).send({
                status: 404,
                message: "Blog doesn't exist!",
            });
        }

        // Check if the user is the owner of the blog, and deny access if not
        if (blogData.userId != userId) {
            return res.status(401).send({
                status: 401,
                message: "Unauthorized to delete the blog. You are not the owner of the blog.",
            });
        }
    } catch (err) {
        // Handle errors in case of a database query issue
        return res.status(400).send({
            status: 400,
            message: "Failed to fetch blog",
            data: err,
        });
    }

    try {
        // Delete the blog from the database
        await Blog.findByIdAndDelete(blogId);

        // Send a 200 OK response to indicate successful deletion
        return res.status(200).send({
            status: 200,
            message: "Blog Deleted Successfully",
        });
    } catch (err) {
        // Handle errors in case of a database deletion issue
        return res.status(400).send({
            status: 400,
            message: "Failed to delete blog",
            data: err,
        });
    }
};


// PUT - Edit blog
const editBlog = async (req, res) => {

    // Input validation using Joi
    const isValid = Joi.object({
        blogId: Joi.string().required(),
        title: Joi.string().required(),
        textBody: Joi.string().min(30).max(1000).required(),
    }).validate(req.body);


    // If input is invalid, return a 400 Bad Request response
    if (isValid.error) {
        return res.status(400).send({
            status: 400,
            message: "Invalid Input",
            data: isValid.error,
        });
    }

    const { blogId, title, textBody } = req.body;
    const userId = req.locals.userId;

    let blogData;

    try {
        // Attempt to find the blog post by its ID
        blogData = await Blog.findById(blogId);
     

        // If the blog post doesn't exist, return a 404 Not Found response
        if (!blogData) {
            return res.status(404).send({
                status: 404,
                message: "Blog doesn't exist!",
            });
        }

        // Check if the user trying to edit the blog is the owner
        if (blogData.userId != userId) {
            return res.status(401).send({
                status: 401,
                message: "Unauthorized to delete the blog. You are not the owner of the blog.",
            });
        }
    } catch (err) {
        // Handle database query errors with a 400 Bad Request response
        return res.status(400).send({
            status: 400,
            message: "Failed to fetch blog",
            data: err,
        });
    }

    // Calculate the time difference between the current time and the blog's creation time
    const creationDateTime = blogData.creationDateTime;
    const currentTime = Date.now();
    const diff = (currentTime - creationDateTime) / (1000 * 60);

    // If more than 30 minutes have passed since creation, disallow editing
    if (diff > 30) {
        return res.status(400).send({
            status: 400,
            message: "Not allowed to edit blogs after 30 minutes",
        });
    }

    //   data to be updated in the blog
    const blogObj = {
        title,
        textBody,
    };

    try {
        //  update the blog post in the database
 
        await Blog.findByIdAndUpdate(blogId, blogObj);
  

        // If successful, return a 200 OK response
        return res.status(200).send({
            status: 200,
            message: "Blog updated successfully",
        });
    } catch (err) {
        // Handle database update errors with a 400 Bad Request response
        return res.status(400).send({
            status: 400,
            message: "Failed to update blog",
            data: err,
        });
    }
};

// ---------home page blogs---------------------------------
const getHomepageBlogs = async (req, res) => {
    // Get the current user's ID from the request's 'locals'
    const currentUserId = req.locals.userId;
  


    let followingList;
    try {
        // Attempt to find users that the current user is following
        followingList = await Follow.find({currentUserId });
     

        // Check if there are no following users
        if (followingList.length === 0) {
            return res.status(400).send({
                status: 400,
                message: "Follow users to display blogs",
                currentUserId
            });
        }
    } catch (err) {
        // Handle errors while fetching the list of following users
        console.log(err) 
        return res.status(400).send({
            status: 400,
            message: "Failed to fetch following users list",
            data: err,
        })
    }

    // Initialize an array to store the IDs of following users
    let followingUserIds = [];

    // Extract the following user IDs from the 'followingList' and store them in 'followingUserIds'
    followingList.forEach((followObj) => {
        followingUserIds.push(followObj.followingUserId);
    });

    try {
        // Fetch blogs created by the following users that are not deleted
        const homepageBlogs = await Blog.find({
            userId: { $in: followingUserIds },
            isDeleted: false,
        }).sort({ creationDateTime: -1 });
        

        // Return the retrieved blogs in the response
        res.status(200).json({
            status: 200,
            message: "Fetched homepage blogs successfully",
            data: homepageBlogs,
        });
    } catch (err) {
        // Handle errors while fetching homepage blogs
        return res.status(400).send({
            status: 400,
            message: "Failed to fetch homepage blogs",
            data: err,
        });
    }
}











// Export the functions as module exports
module.exports = { createBlog, getUserBlogs, deleteBlog, editBlog, getHomepageBlogs };













