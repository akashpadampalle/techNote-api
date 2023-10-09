const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URI)
    } catch (error) {
        console.log(error)
    }
} 

module.exports = connectDB

// mongoose.connect(process.env.DATABASE_URI)

// module.exports = mongoose.connection