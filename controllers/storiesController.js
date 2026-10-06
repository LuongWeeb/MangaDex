const storiesModel = require('../models/storiesModel');

const allowedSorts = new Set(['latest', 'views', 'likes', 'name', 'title', 'follows']);
const allowedStatuses = new Set(['all', 'ongoing', 'completed']);
const allowedCountries = new Set(['all', 'china', 'japan', 'korea', 'vietnam']);

function toSlugList(value) {
  if (typeof value !== 'string') return [];
  return [...new Set(value.split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => /^[a-z0-9-]{1,120}$/.test(item)))].slice(0, 47);
}

function getListOptions(query) {
  const requestedPage = Number(query.page);
  const requestedLimit = Number(query.limit);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 50)
    : 18;
  const sort = allowedSorts.has(query.sort) ? query.sort : 'latest';
  const status = allowedStatuses.has(query.status) ? query.status : 'all';
  const country = allowedCountries.has(query.country) ? query.country : 'all';
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 100) : '';
  const rawMinChapters = Number(query.min_chapters);
  const minChapters = [0, 1, 10, 50, 100].includes(rawMinChapters) ? rawMinChapters : 0;
  const includeCategories = toSlugList(query.include_cats);
  const excludeCategories = toSlugList(query.exclude_cats);

  return {
    page, limit, sort: sort === 'title' ? 'name' : sort, status, country, search,
    minChapters, includeCategories, excludeCategories
  };
}

exports.getAll = (req, res) => {
  const options = getListOptions(req.query);

  storiesModel.getAll(options, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getByCategory = (req, res) => {
  const options = {
    ...getListOptions(req.query),
    categorySlug: req.params.slug
  };

  storiesModel.getAll(options, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
};

exports.getById = (req, res) => {
  storiesModel.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json(result);
  });
};

exports.getBySlug = (req, res) => {
  storiesModel.getBySlug(req.params.slug, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result) return res.status(404).json({ message: 'Không tìm thấy truyện' });
    res.json(result);
  });
};

exports.incrementViews = (req, res) => {
  storiesModel.incrementViews(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Views updated' });
  });
};

exports.create = (req, res) => {
  storiesModel.create(req.body, (err, insertId) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: insertId });
  });
};

exports.update = (req, res) => {
  storiesModel.update(req.params.id, req.body, (err, affectedRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated' });
  });
};

exports.remove = (req, res) => {
  storiesModel.remove(req.params.id, (err, affectedRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  });
};
