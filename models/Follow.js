const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FollowSchema = new Schema({
    currentUserId: {
        type: String,
        required: true,
        ref: "users"
    },
    followingUserId: {
        type: String,
        required: true,
        ref: "users"
    },
    creationDateTime: {
        type: Date,
        required: true,
        default: Date.now
    }
});

module.exports = mongoose.model("follows", FollowSchema);
