const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');
const { toJSON, paginate } = require('./plugins');
const User = require('./user.model');
const Project = require('./project.model');
const Annotation = require('./annotation.model');
const Category = require('./category.model');
const Translation = require('./translation.model');
const { elasticClient } = require('../config/config');

const articleSchema = mongoose.Schema(
  {
    title: { type: String, default: '', required: true, trim: true, es_indexed: true },
    description: { type: String, default: '', es_indexed: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      es_indexed: true,
      es_select: '_id name email',
    },
    content: { type: String, default: '', es_indexed: true },
    annotations: [Annotation.schema],
    categories: [Category.schema],
    translation: Translation.schema,
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      es_indexed: true,
      es_select: '_id title',
    },
    seqLabelVersions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SeqLabelVersion',
      },
    ],
    categoryVersions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CategoryVersion',
      },
    ],
    translationVersions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TranslationVersion',
      },
    ],
    lastCurator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      es_select: '_id name email',
    },
    createdAt: { type: Date, es_type: 'date', es_indexed: true },
    updatedAt: { type: Date, es_type: 'date', es_indexed: true },
  },
  {
    timestamps: true,
  }
);

articleSchema.plugin(toJSON);
articleSchema.plugin(paginate);
articleSchema.plugin(mongoosastic, {
  esClient: elasticClient,
  populate: [
    {
      path: 'user',
      model: 'User',
      schema: User.schema,
      select: '_id name email',
    },
    {
      path: 'project',
      model: 'Project',
      schema: Project.schema,
      select: '_id title',
    },
  ],
});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
