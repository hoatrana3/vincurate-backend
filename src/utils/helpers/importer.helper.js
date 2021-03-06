const neatCsv = require('neat-csv');
const { randomHexColor } = require('random-hex-color-generator');
const { Article, Annotation, Label, Category, Translation } = require('../../models');
const { getAllLabels } = require('../../services/label.service');
const { getAllCategories } = require('../../services/category.service');
const { convertCONLLToJSONL, convertPlainTextToJSONL, convertMLDataToCONLL } = require('./converter.helper');

function generateArticleDescription(article) {
  const limitCharacter = 250;
  const annos = article.annotations
    .filter((a) => a.offsetEnd <= limitCharacter)
    .sort((a1, a2) => a2.offsetEnd - a1.offsetEnd);
  let desc = article.content.substring(0, limitCharacter);

  annos.forEach((anno) => {
    let annotatedStr = desc.substring(anno.offsetStart, anno.offsetEnd);
    annotatedStr = `<span class="has-concept concept-${anno.label.value}">${annotatedStr}</span>`;
    desc = [desc.slice(0, anno.offsetStart), annotatedStr, desc.slice(anno.offsetEnd)].join('');
  });

  return `${desc}...`;
}

async function importArticleByJSONL(user, project, data, options) {
  const article = new Article();
  article.user = user.id;
  article.lastCurator = user.id;
  article.project = project.id;
  article.title = `Article #${article.id.substring(article.id.length - 5).toUpperCase()}`;

  const nlabels = [];
  const allLabels = await getAllLabels();
  const nCategories = [];
  const allCategories = await getAllCategories();
  const sentences = [];
  let currentOffset = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const [index, line] of data.entries()) {
    const obj = typeof line === 'string' ? JSON.parse(line) : line;
    const { text, labels, categories, translation } = obj;
    const articleSentence = options && options.formatter ? options.formatter(text) : text;
    sentences.push(articleSentence);

    if (labels && labels.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const l of labels) {
        const annotation = new Annotation();
        const [offsetStart, offsetEnd, value] = l;
        annotation.offsetStart = offsetStart + currentOffset + index;
        annotation.offsetEnd = offsetEnd + currentOffset + index;
        annotation.article = article.id;
        annotation.user = user.id;

        let label = allLabels.find((_l) => _l.value === value);
        // eslint-disable-next-line no-await-in-loop
        if (!label) label = await Label.findOne({ value }).exec();
        if (!label) {
          label = new Label();
          label.value = value;
          label.name = value; // TODO: Label real name?
          label.color = randomHexColor();
          label.creator = user.id;

          nlabels.push(label);
        }

        const labelProjIdx = project.labels.findIndex((l) => l.id === label.id);
        if (labelProjIdx < 0) project.labels.push(label);

        annotation.label = label;
        allLabels.push(label);
        article.annotations.push(annotation);
      }
    }

    if (categories && categories.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const c of categories) {
        let category = allCategories.find((_l) => _l.value === c);
        // eslint-disable-next-line no-await-in-loop
        if (!category) category = await Label.findOne({ value: c }).exec();
        if (!category) {
          category = new Category();
          category.value = c;
          category.creator = user;

          nCategories.push(category);
        }

        allCategories.push(category);
        article.categories.push(category);
      }
    }

    if (translation && translation.length) {
      const nTranslation = new Translation();
      nTranslation.content = translation;
      nTranslation.creator = user;

      article.translation = nTranslation;
    }

    currentOffset += articleSentence.length;
  }

  article.content = sentences.join(' ');
  article.description = generateArticleDescription(article);

  return {
    article,
    labels: nlabels,
    categories: nCategories,
  };
}

async function importArticleByCoNLL(user, project, data, options) {
  let headers = ['text', 'label'];
  let separator = '\t';
  let lineSeparator = () => {};

  if (options && options.headers) headers = options.headers;
  if (options && options.separator) separator = options.separator;
  if (options && options.lineSeparator) lineSeparator = options.lineSeparator;

  const rows = await neatCsv(data, { headers, separator });
  const jsonlData = convertCONLLToJSONL(rows, lineSeparator);
  const result = await importArticleByJSONL(user, project, jsonlData, options);

  return result;
}

async function importArticleByNER(user, project, data) {
  const headers = ['senIndex', 'text', 'posTag', 'label', 'parent', 'relation'];
  const result = await importArticleByCoNLL(user, project, data, {
    headers,
    separator: ',',
    lineSeparator(row, rows, index) {
      return index === rows.length - 1 || rows[index + 1].senIndex === '1';
    },
    formatter(text) {
      const regex = /(.+)_(.+)/g;
      while (text.match(regex)) {
        // eslint-disable-next-line no-param-reassign
        text = text.replace(regex, '$1 $2').trim();
      }
      return text;
    },
  });

  return result;
}

async function importArticleByMLData(user, project, data) {
  const conllData = convertMLDataToCONLL(data);
  const result = await importArticleByCoNLL(user, project, conllData);

  return result;
}

async function importArticleByPlainText(user, project, data) {
  const jsonlData = convertPlainTextToJSONL(data);
  const result = await importArticleByJSONL(user, project, jsonlData);

  return result;
}

const ImporterHelper = {
  generateArticleDescription,
  importArticleByJSONL,
  importArticleByCoNLL,
  importArticleByNER,
  importArticleByMLData,
  importArticleByPlainText,
};

module.exports = ImporterHelper;
