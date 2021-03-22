const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getArticles = {
  query: Joi.object().keys({
    q: Joi.string(),
    fields: Joi.string(),
    order: Joi.string(),
    per: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const uploadFile = {
  payload: Joi.object().keys({
    file: Joi.binary().required(),
    filename: Joi.string(),
  }),
  body: Joi.object().keys({
    method: Joi.string(),
    projectId: Joi.string().required(),
  }),
};

const getArticle = {
  params: Joi.object().keys({
    articleId: Joi.string().custom(objectId),
  }),
};

const deleteArticle = {
  params: Joi.object().keys({
    articleId: Joi.string().custom(objectId),
  }),
};

const updateArticle = {
  params: Joi.object().keys({
    articleId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      content: Joi.string(),
    })
    .min(1),
};

const updateArticleAnnotations = {
  params: Joi.object().keys({
    articleId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      annotations: Joi.array().items(Joi.object()),
    })
    .min(1),
};

const createArticleEditVersion = {
  params: Joi.object().keys({
    articleId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      annotations: Joi.array().items(Joi.object()),
    })
    .min(1),
};

module.exports = {
  uploadFile,
  getArticle,
  getArticles,
  deleteArticle,
  updateArticle,
  updateArticleAnnotations,
  createArticleEditVersion,
};
