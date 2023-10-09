const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler') // reduce use of try-catch
const bcrypt = require('bcrypt')


/**
 * @desc Get all Users
 * @route GET /users
 * @access Private
 */

const getAllUsers = asyncHandler(async (req, res) => {
    // lean method reduce all extra functionality and just return json like object
    const users = await User.find().select('-password').lean()
    if (!users?.length) {
        return res.status(400).json({ message: "No users found" })
    }

    return res.json(users)
})

/**
 * @desc Create new user
 * @route POST /users
 * @access Private
 */

const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body

    //check 
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({ message: "All fields are required" })
    }

    // check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: "Duplicate username" })
    }

    // Hash password
    const hashedPass = await bcrypt.hash(password, 10) // salt rounds

    //create and store user
    const userObject = {
        username,
        password: hashedPass,
        roles
    }

    const user = await User.create(userObject)

    if (user) {
        res.status(201).json({ message: `New User ${username} created` })
    } else {
        res.status(400).json({ message: 'Invalid user data received' })
    }

})

/**
 * @desc Update a user
 * @route PATCH /users
 * @access Private
 */

const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password } = req.body

    //Confirm data
    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }


    // check duplicate 
    const duplicate = await User.findOne({ username }).lean().exec()
    // allow update to original User
    if (duplicate && duplicate._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    user.username = username
    user.roles = roles
    user.active = active

    if (password) {
        user.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await user.save()
    res.json({ message: `${updatedUser.username} updated` })
})

/**
 * @desc Delete a User
 * @route DELETE /users
 * @access Private
 */

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id) {
        return res.status(400).json({ message: "User ID is required" })
    }

    const note = await Note.findOne({ user: id }).lean().exec()

    if (note) {
        return res.status(409).json({ message: "User has assigned notes" })
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: 'User is not found' })
    }


    const result = await user.deleteOne()

    res.json({ message: `Username ${result.username} with ID ${result._id} deleted` })

})


module.exports = { getAllUsers, createNewUser, updateUser, deleteUser }