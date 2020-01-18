const express = require('express')
const xss = require('xss')
const path = require('path')
const FoldersService = require('./folders-service')

const foldersRouter = express.Router()
const jsonParser = express.json()

const sanitizeFolder = folder => ({
    id: folder.id,
    folder_name: xss(folder.folder_name)
})


foldersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        FoldersService.getAllFolders(knexInstance)
            .then(folders => {
                res.json(folders.map(sanitizeFolder))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const folder_name  = req.body.name
        const newFolder = { folder_name }
        if (!folder_name) {
            return res.status(400).send('Folder name is required')
        }

        FoldersService.addFolder(req.app.get('db'), newFolder)
            .then(folder => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                    .json(sanitizeFolder(folder))
            })
            .catch(next)
    })

foldersRouter
    .route('/:id')
    .all((req, res, next) => {
        FoldersService.getById(req.app.get('db'), req.params.id)
            .then(folder => {
                if (!folder) {
                    return res.status(404).json({
                        error: { message: 'Folder does not exist' }
                    })
                }
                res.folder = folder
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(sanitizeFolder(res.folder))
    })
    .delete((req, res, next) => {
        res.status(204).end()
        FoldersService.deleteFolder(req.app.get('db'), req.params.id)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { folder_name } = req.body
        const folderUpdate = { folder_name }

        if (!name) {
            return res.status(400).json({
                error: { message: 'Request must contain folder name' }
            })
        }
        FoldersService.updateFolder(req.app.get('db'), req.params.id, folderUpdate)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = foldersRouter