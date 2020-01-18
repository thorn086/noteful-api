const express = require('express')
const xss = require('xss')
const path = require('path')
const NotesService = require('./notes-service')

const notesRouter = express.Router()
const bodyParser = express.json()

const sanitizeNote = note => ({
  id: note.id,
  note_name: xss(note.note_name),
  content: xss(note.content),
  folder_id: note.folder_id,
  modified: note.modified
})

notesRouter
  .route('/')
  .get((req, res, next) => {    
    const knexInstance = req.app.get('db')
    NotesService.getAllNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(sanitizeNote))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    const { note_name, content, folder_id } = req.body
    const newNote = { note_name, content, folder_id }

    for (const [key, value] of Object.entries(newNote)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request` }
        })
      }
    }
    NotesService.addNote(req.app.get('db'), newNote)
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(sanitizeNote(note))
      })
      .catch(next)
  })

notesRouter
  .route('/:id')
  .all((req, res, next) => {
    NotesService.getById(req.app.get('db'), req.params.id)
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: 'Note does not exist' }
          })
        }
        res.note = note
        next()
      })
  })
  .get((req, res, next) => {
    res.json(sanitizeNote(res.note))
  })
  .delete(bodyParser, (req, res, next) => {
    const { id } = req.params

    NotesService.deleteNote(req.app.get('db'), id)
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(bodyParser, (req, res, next) => {
    const { note_name, folder_id, content } = req.body
    const noteUpdate = { note_name, folder_id, content }

    const numValues = Object.values(articleToUpdate).filter(Boolean).length
    if (numValues === 0) {
      return res.status(400).json({
        error: { message: 'Request must contain either note_name, folder_id, or content' }
      })
    }
    NotesService.updateNote(req.app.get('db'), req.params.id, noteUpdate)
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = notesRouter