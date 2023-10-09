const Note = require('../models/Note')
const User = require('../models/User')
const asyncHandler = require('express-async-handler')

/**
 * @description Get all the notes
 * @route GET /notes
 * @access Private
 */
const getAllNotes = asyncHandler(async (req, res) => {
    // Get all notes from MongoDB
    const notes = await Note.find().lean()

    // If no notes 
    if (!notes?.length) {
        return res.status(400).json({ message: 'No notes found' })
    }

    // Add username to each note before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE 
    // You could also do this with a for...of loop
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))

    res.json(notesWithUser)

})


/**
 * @description Create a note
 * @route POST /notes
 * @access Private
 */
const createNote = asyncHandler(async (req, res) => {

    const { userId, title, text } = req.body

    // check data 
    if (!userId || !title || !text) {
        return res.status(400).json({ message: 'All fields required' })
    }

    // check for duplicate note
    const duplicate = await Note.findOne({ title }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    // check if user is valid or not
    const user = await User.findById(userId).select('-password').lean().exec()

    if (!user) {
        return res.status(400).json({ message: 'Invalid user id' })
    }

    // note object 
    const noteObject = {
        user: userId,
        title,
        text,
        completed: false
    }


    const note = await Note.create(noteObject)


    if (note) {
        return res.json({ message: `note with title " ${note.title} " is assigned to ${user.username}` })
    } else {
        return res.status(400).json({ message: "Invalid note data recieved" })
    }

})


/**
 * @description Update a note
 * @route PATCH /notes
 * @access Private
 */
const updateNote = asyncHandler(async (req, res) => {
    const { id, userId, title, text, completed } = req.body

    // check 
    if (!id || !userId || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // check for valid user id
    const user = await User.findById(userId).select('-password').lean().exec()
    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }


    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).lean().exec()

    // Allow renaming of the original note 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    // updating note
    note.title = title
    note.text = text
    note.user = userId
    note.completed = completed

    const updatedNote = await note.save()

    if (updatedNote) {
        res.json({ message: `note title: " ${updatedNote.title} " is updated` })
    } else {
        res.status(400).json({ message: 'Invalid note data received' })
    }

})


/**
 * @description Delete a note
 * @route DELETE /notes
 * @access Private
 */
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    // check 
    if (!id) {
        return res.status(400).json({ message: 'ID is required' })
    }

    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'Invalid id received' })
    }

    const result = await note.deleteOne()

    res.json({ message: `Note title: " ${result.title} " is deleted` })
})


module.exports = { getAllNotes, createNote, updateNote, deleteNote }