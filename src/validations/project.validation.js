const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createProject = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    owner: Joi.string().custom(objectId).required(),
    roles: Joi.array().items(
      Joi.object().keys({
        user: Joi.string().custom(objectId),
        role: Joi.string(),
      })
    ),
    labels: Joi.array().items(Joi.string().custom(objectId)),
    categories: Joi.array().items(Joi.string().custom(objectId)),
    types: Joi.array().items(Joi.string()).required(),
  }),
};

const getProjects = {
  query: Joi.object().keys({
    title: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getProject = {
  params: Joi.object().keys({
    projectId: Joi.string().custom(objectId),
  }),
};

const updateProject = {
  params: Joi.object().keys({
    projectId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    title: Joi.string().required(),
    owner: Joi.string().custom(objectId).required(),
    roles: Joi.array().items(
      Joi.object().keys({
        user: Joi.string().custom(objectId),
        role: Joi.string(),
      })
    ),
    labels: Joi.array().items(Joi.string().custom(objectId)),
    categories: Joi.array().items(Joi.string().custom(objectId)),
    types: Joi.array().items(Joi.string()).required(),
  }),
};

const deleteProject = {
  params: Joi.object().keys({
    projectId: Joi.string().custom(objectId),
  }),
};

const updateProjectRoles = {
  params: Joi.object().keys({
    projectId: Joi.string().custom(objectId),
    body: Joi.array().items(
      Joi.object().keys({
        user: Joi.string().custom(objectId),
        role: Joi.string(),
      })
    ),
  }),
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  updateProjectRoles,
};
