require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const { NODE_ENV} = require('./config')
const errorHandler = require('./error-handler')
const app = express()
const foldersRouter = require('./folders/folders-router')
const morganOption = (NODE_ENV === 'production') ? 'tiny' : 'common';
const notesRouter = require('./notes/notes-router')
app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(errorHandler)
app.get('/', (req, res) =>{
    res.send("Hello, world!")
})
app.use('/api/folders', foldersRouter)
app.use('/api/notes', notesRouter)

module.exports = app