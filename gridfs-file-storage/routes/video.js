const express = require('express');
const videoRouter = express.Router();
const mongoose = require('mongoose');
const Video = require('../models/video');
const config = require('../config');

module.exports = (upload) => {
    const url = config.mongoURI;
    const connect = mongoose.createConnection(url, { useNewUrlParser: true, useUnifiedTopology: true });

    let gfs;

    connect.once('open', () => {
        // initialize stream
        gfs = new mongoose.mongo.GridFSBucket(connect.db, {
            bucketName: "videos"
        });
    });

    /*
        POST: Upload a single image/file to Image collection
    */
    videoRouter.route('/')
        .post(upload.single('file'), (req, res, next) => {
            console.log(req.body);
            // check for existing images
            Video.findOne({ caption: req.body.caption })
                .then((video) => {
                    console.log(video);
                    if (video) {
                        return res.status(200).json({
                            success: false,
                            message: 'Video already exists',
                        });
                    }

                    let newVideo= new Video({
                        caption: req.body.caption,
                        filename: req.file.filename,
                        fileId: req.file.id,
                    });

                    newVideo.save()
                        .then((video) => {

                            res.status(200).json({
                                success: true,
                                video,
                            });
                        })
                        .catch(err => res.status(500).json(err));
                })
                .catch(err => res.status(500).json(err));
        })
        .get((req, res, next) => {
            Video.find({})
                .then(videos => {
                    res.status(200).json({
                        success: true,
                        videos,
                    });
                })
                .catch(err => res.status(500).json(err));
        });

    /*
        GET: Delete an video from the collection
    */
    videoRouter.route('/video/delete/:id')
        .get((req, res, next) => {
            Video.findOne({ _id: req.params.id })
                .then((video) => {
                    if (video) {
                        Video.deleteOne({ _id: req.params.id })
                            .then(() => {
                                return res.status(200).json({
                                    success: true,
                                    message: `File with ID: ${req.params.id} deleted`,
                                });
                            })
                            .catch(err => { return res.status(500).json(err) });
                    } else {
                        res.status(200).json({
                            success: false,
                            message: `File with ID: ${req.params.id} not found`,
                        });
                    }
                })
                .catch(err => res.status(500).json(err));
        });

    /*
        GET: Fetch most recently added record
    */
    videoRouter.route('/video/recent')
        .get((req, res, next) => {
            Video.findOne({}, {}, { sort: { '_id': -1 } })
                .then((video) => {
                    res.status(200).json({
                        success: true,
                        video,
                    });
                })
                .catch(err => res.status(500).json(err));
        });

    /*
        POST: Upload multiple files upto 3
    */
    videoRouter.route('/video/multiple')
        .post(upload.array('file', 3), (req, res, next) => {
            res.status(200).json({
                success: true,
                message: `${req.files.length} files uploaded successfully`,
            });
        });

    /*
        GET: Fetches all the files in the uploads collection
    */
    videoRouter.route('/video/files')
        .get((req, res, next) => {
            gfs.find().toArray((err, files) => {
                if (!files || files.length === 0) {
                    return res.status(200).json({
                        success: false,
                        message: 'No files available'
                    });
                }

                files.map(file => {
                    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType === 'image/svg') {
                        file.isImage = true;
                    } else {
                        file.isImage = false;
                    }
                });

                res.status(200).json({
                    success: true,
                    files,
                });
            });
        });

    /*
        GET: Fetches a particular file by filename
    */
    videoRouter.route('/video/:filename')
        .get((req, res, next) => {
            gfs.find({ filename: req.params.filename }).toArray((err, files) => {
                if (!files[0] || files.length === 0) {
                    return res.status(200).json({
                        success: false,
                        message: 'No files available',
                    });
                }

                res.status(200).json({
                    success: true,
                    file: files[0],
                });
            });
        });

    /* 
        GET: Fetches a particular video and render on browser
    */
    videoRouter.route('/video/:filename')
        .get((req, res, next) => {
            gfs.find({ filename: req.params.filename }).toArray((err, files) => {
                if (!files[0] || files.length === 0) {
                    return res.status(200).json({
                        success: false,
                        message: 'No files available',
                    });
                }

                if (files[0].contentType === 'image/jpeg' || files[0].contentType === 'image/png' || files[0].contentType === 'image/svg+xml') {
                    // render image to browser
                    gfs.openDownloadStreamByName(req.params.filename).pipe(res);
                } else {
                    res.status(404).json({
                        err: 'Not an image',
                    });
                }
            });
        });

    /*
        DELETE: Delete a particular file by an ID
    */
    videoRouter.route('/video/del/:id')
        .post((req, res, next) => {
            console.log(req.params.id);
            gfs.delete(new mongoose.Types.ObjectId(req.params.id), (err, data) => {
                if (err) {
                    return res.status(404).json({ err: err });
                }

                res.status(200).json({
                    success: true,
                    message: `File with ID ${req.params.id} is deleted`,
                });
            });
        });

    return videoRouter;
};