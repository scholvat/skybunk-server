const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

require('../models/Posts');

const Post = mongoose.model('Post');
const { verifyToken } = require('../helpers/authorization');
const { classifyError } = require('../helpers/formatters');
const { requestValidator } = require('../helpers/formatters');

/**
 * Methods:
 *  post(/) => Creates new post
 *  get(/:id) => Gets post by id
 *  put(/:id) => Updates post with given id
 *  delete(/:id) => Deletes post with given id
 *  get(/:id/comments) => Gets all comments for post
 *  post(/:id/comment) => Adds a new comment to the post
 *  delete(/:pid/comment/:cid) => Deletes comment with
 *    id cid from post with id pid
 */

/**
 * Create new post
 */
router.post('/', verifyToken, (req, res) => {
  Post.create(req.body, req.user).then((post) => {
    res.json(post);
  })
    .catch((err) => {
      const errRes = classifyError(err);
      res.status(errRes.status).json(errRes.message);
    });
});

/**
 * Get post by id
 */
router.get('/:id', verifyToken, (req, res) => {
  Post.get(req.params.id).then((post) => {
    res.json(post);
  })
    .catch((err) => {
      const errRes = classifyError(err);
      res.status(errRes.status).json(errRes.message);
    });
});

/**
 * Get all posts
 */
router.get('/', verifyToken, (req, res) => {
  Post.getAllPaginated(req.get('page')).then((posts) => {
    res.json(posts);
  })
    .catch((err) => {
      res.status(500).json(err.message);
    });
});

/**
 * Get all posts from a specific user
 */
router.get('/user/:id', verifyToken, (req, res) => {
  Post.getUserPosts(req.params.id, req.get('page')).then((posts) => {
    res.json(posts);
  }).catch((err) => {
    const errRes = classifyError(err);
    res.status(errRes.status).json(errRes.message);
  });
});

/**
 * Update a post
 */
router.put('/:id', verifyToken, (req, res) => {
  Post.updatePost(req.params.id, req.body).then((post) => {
    res.json(post);
  })
    .catch((err) => {
      const errRes = classifyError(err);
      res.status(errRes.status).json(errRes.message);
    });
});

/**
 * Like a post
 */
router.post('/:pid/like', verifyToken, (req, res) => {
  Post.likePost(req.params.pid, req.user._id, req.body.addLike)
    .then((post) => {
      res.json(post);
    })
    .catch((err) => {
      const errRes = classifyError(err);
      res.status(errRes.status).json(errRes.message);
    });
});

/**
 * Delete a post
 */
router.delete('/:id', verifyToken, (req, res) => {
  Post.delete(req.params.id).then((msg) => {
    res.json(msg);
  })
    .catch((err) => {
      const errRes = classifyError(err);
      res.status(errRes.status).json(errRes.message);
    });
});

/**
 * Get all comments associated with the post
 */
router.get('/:id/comments', verifyToken, (req, res) => {
  Post.getComments(req.params.id).then((comments) => {
    res.json(200, comments);
  })
    .catch((err) => {
      const errRes = classifyError(err);
      res.status(errRes.status).json(errRes.message);
    });
});

/**
 * Add a new comment to the post
 * @returns all comments for post
 */
router.post('/:id/comment', verifyToken, (req, res) => {
  Post.addComment(req.params.id, req.body, req.user).then((comment) => {
    res.json(comment);
  })
    .catch((err) => {
      const errRes = classifyError(err);
      res.status(errRes.status).json(errRes.message);
    });
});

/**
 * Update a comment
 * @param {string} pid - post's id
 * @param {string} cid - comment's id
 */
router.put('/:pid/comment/:cid', verifyToken, (req, res) => {
  Post.updateComment(req.params.pid, req.params.cid, req.body).then((comment) => {
    res.json(comment);
  })
    .catch((err) => {
      const errRes = classifyError(err);
      res.status(errRes.status).json(errRes.message);
    });
});

/**
 * Delete a comment
 */
router.delete('/:pid/comment/:cid', verifyToken, (req, res) => {
  Post.deleteComment(req.params.pid, req.params.cid).then((msg) => {
    res.json(msg);
  })
    .catch((err) => {
      const errRes = classifyError(err);
      res.status(errRes.status).json(errRes.message);
    });
});

/**
 * Add an image
 */
router.post('/:id/image', verifyToken, upload.single('image'), (req, res) => {
  Post.findOne({ _id: req.params.id })
    .populate('author')
    .then((post) => {
      if (post.author._id.toString() !== req.user._id.toString()) {
        res.status(403);
        return;
      }

      post.addMedia('image', req.file.buffer).then((media) => {
        res.json(media.image.buffer.toString('base64'));
      }).catch((err) => {
        res.json(err);
      });
    }).catch((err) => {
      res.json(err);
    });
});

/**
 * Get the image
 */
router.get('/:id/image', verifyToken, (req, res) => {
  Post.findOne({ _id: req.params.id })
    .then((post) => {
      post.getMedia('image').then((image) => {
        res.json(image);
      });
    }).catch((err) => {
      console.log(err);
      res.json(err);
    });
});

/**
 * Delete the image
 */
router.delete('/:id/image', verifyToken, (req, res) => {
  Post.findOne({ _id: req.params.id })
    .populate('author')
    .then((post) => {
      if (!req.user.role.includes('admin') && post.author._id.toString() !== req.user._id.toString()) {
        res.status(403);
        return;
      }
      post.removeMedia().then(() => {
        res.json();
      }).catch((err) => {
        console.error(err);
        res.json(err);
      });
    }).catch((err) => {
      console.error(err);
      res.json(err);
    });
});

// /////////////////////
//      POLLS
// /////////////////////
router.get('/:id/poll', verifyToken, (req, res) => {
  Post.findById(req.params.id)
    .populate('author')
    .populate({
      path: 'media',
      populate: {
        path: 'poll',
        populate: {
          path: 'usersVoted',
        },
      },
    })
    .then((post) => {
      if (!post.media.poll) {
        res.status(404).json();
        return;
      }
      res.json(post.media.poll);
    })
    .catch((err) => {
      res.status(500).json(err.toString());
    });
});

router.post('/:id/poll', verifyToken, (req, res) => {
  Post.findById(req.params.id)
    .populate('author')
    .then((post) => {
      if (post.author._id.toString() !== req.user._id.toString()) {
        res.status(403).json({});
        return;
      }

      const validation = requestValidator(['options', 'multiSelect'], req.body);
      if (validation.status !== 200) {
        res.status(validation.status).json(validation.message);
        return;
      }

      post.addMedia('poll', { ...req.body, userID: req.user._id }).then((media) => {
        res.json(media.poll);
      }).catch((err) => {
        res.status(500).json(err.toString());
      });
    }).catch((err) => {
      res.status(500).json(err.toString());
    });
});

router.post('/:id/poll/option', verifyToken, (req, res) => {
  Post.findById(req.params.id)
    .populate('author')
    .populate({
      path: 'media',
      populate: {
        path: 'poll',
      },
    })
    .then((post) => {
      if (!post.media.poll) {
        res.status(404).json();
        return;
      }

      if (!post.media.poll.open && post.author._id.toString() !== req.user._id.toString()) {
        res.status(403).json({});
        return;
      }

      const validation = requestValidator(['option'], req.body);
      if (validation.status !== 200) {
        res.status(validation.status).json(validation.message);
      }

      post.media.poll.addOption(req.body.option, req.user._id).then((poll) => {
        res.json(poll);
      })
        .catch((err) => {
          res.status(500).json(err.toString());
        });
    })
    .catch((err) => {
      res.status(500).json(err.toString());
    });
});

router.post('/:id/poll/option/delete', verifyToken, (req, res) => {
  Post.findById(req.params.id)
    .populate('author')
    .populate({
      path: 'media',
      populate: {
        path: 'poll',
      },
    })
    .then((post) => {
      if (!post.media.poll) {
        res.status(404).json();
        return;
      }

      if (post.author._id.toString() !== req.user._id.toString() && !req.user.role.includes('admin')
          && !(req.body.creator && req.body.creator.toString() === req.user._id.toString())) {
        res.status(403).json({});
        return;
      }

      const validation = requestValidator(['_id', 'creator'], req.body);
      if (validation.status !== 200) {
        res.status(validation.status).json(validation.message);
      }

      post.media.poll.removeOption(req.body).then((poll) => {
        res.json(poll);
      })
        .catch((err) => {
          res.status(500).json(err.toString());
        });
    })
    .catch((err) => {
      res.status(500).json(err.toString());
    });
});

router.post('/:id/poll/vote', verifyToken, (req, res) => {
  Post.findById(req.params.id)
    .populate('author')
    .populate({
      path: 'media',
      populate: {
        path: 'poll',
      },
    })
    .then((post) => {
      if (!post.media.poll) {
        res.json(404);
        return;
      }

      const validation = requestValidator(['optionId'], req.body);
      if (validation.status !== 200) {
        res.status(validation.status).json(validation.message);
      }

      if (req.body.retract) {
        post.media.poll.retractVote(req.user._id, req.body.optionId).then((poll) => {
          res.json(poll);
        })
          .catch((err) => {
            res.status(500).json(err.toString());
          });
      } else {
        post.media.poll.placeVote(req.user._id, req.body.optionId).then((poll) => {
          res.json(poll);
        })
          .catch((err) => {
            res.status(500).json(err.toString());
          });
      }
    })
    .catch((err) => {
      res.status(500).json(err.toString());
    });
});

/**
 * Delete the poll
 */
router.delete('/:id/poll', verifyToken, (req, res) => {
  Post.findOne({ _id: req.params.id })
    .populate('author')
    .then((post) => {
      if (!req.user.role.includes('admin') && post.author._id.toString() !== req.user._id.toString()) {
        res.status(403);
        return;
      }

      post.removeMedia().then(() => {
        res.status(200);
      }).catch((err) => {
        res.json(err);
      });
    }).catch((err) => {
      res.json(err);
    });
});

module.exports = router;
