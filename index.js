const path = require('path');
const Koa = require('koa');
const views = require('koa-views');
const serve = require('koa-static');
const koaBody = require('koa-body')();
const router = require('koa-router')();
const validate = require('koa2-validation');
const Joi = require('joi');
const uuid = require('uuid');
const low = require('lowdb');
const fileAsync = require('lowdb/lib/storages/file-async');
const request = require('request');
const diff = require('./diff');

require('dotenv').config();

const app = new Koa();
app.use(serve('static'));
app.use(views(path.join(__dirname, '/views'), {
   extension: 'ejs',
   options: {
      env: process.env,
      date: timestamp => new Date(timestamp).toLocaleDateString('de'),
      diff,
   },
}));

const schema = {
   body: {
      url: Joi.string().uri().required(),
      intervalValue: Joi.string().allow(''),
      intervalUnit: Joi.string(),
      email: Joi.string().email().required(),
      comment: Joi.string().allow(''),
      endingAt: Joi.string().allow(''),
      selector: Joi.string().allow(''),
   },
};

router
   .get('/', add)
   .post('/', koaBody, validate(schema), create)
   .get('/proxy', proxy)
   .get('/checks', list)
   .get('/:id', show)
   .patch('/:id', koaBody, validate(schema), update)
   .delete('/:id', remove);

app.use(router.routes());
app.listen(process.env.PORT);


/*
 * Database
 */
const db = low('db.json', { storage: fileAsync });
db.defaults({ checks: [] }).write();


/**
 * Post listing.
 */
async function list(ctx) {
   const checks = await db.read().get('checks').value();
   await ctx.render('check-all', { checks });
}

/**
 * Show creation form.
 */
async function add(ctx) {
   await ctx.render('check-add');
}

/**
 * Load URLs from the current origin.
 */
async function proxy(ctx) {
   const url = ctx.query.url;
   let html = await new Promise((resolve) => {
      request({ url }, (error, response, body) => {
         if (error) ctx.throw(500, error);
         resolve(body);
      });
   });
   html = String(html).replace('<head>', `<head><base href="${url}">`);
   ctx.body = html;
}

/**
 * Show one check.
 */
async function show(ctx) {
   const isNew = 'created' in ctx.request.query;
   const check = await db.read().get('checks')
      .find({ id: ctx.params.id })
      .value();

   if (!check) ctx.throw(404, 'invalid check id');

   await ctx.render('check-single', { check, isNew });
}

/**
 * Create a check.
 */
async function create(ctx) {
   const { url, selector, email, intervalValue, intervalUnit, endingAt } = ctx.request.body;

   const timeMap = {
      minutes: 10,
      hours: 60,
      days: 24 * 60,
   };

   const id = uuid();
   const createdAt = Date.now();
   const interval = intervalValue * timeMap[intervalUnit];
   const check = { id, createdAt, url, selector, email, interval, endingAt };

   await db.read().get('checks').push(check).write();

   ctx.redirect(`${process.env.HOST}/${id}?created`);
   ctx.status = 303;
}

/**
 * Update a check.
 */
async function update(ctx) {
   await db.read().get('checks')
      .find({ id: ctx.params.id })
      .assign(ctx.request.body)
      .write();

   ctx.redirect(process.env.HOST);
   ctx.status = 303;
}

/**
 * Remove a check.
 */
async function remove(ctx) {
   await db.read().get('checks')
      .remove({ id: ctx.params.id })
      .write();

   ctx.redirect(process.env.HOST);
   ctx.status = 204;
}
