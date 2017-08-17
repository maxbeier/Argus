const fs = require('fs');
const ejs = require('ejs');
const nodemailer = require('nodemailer');

require('dotenv').config();

const changeTemplate = fs.readFileSync('views/email-change.ejs', 'utf8');

const transporter = nodemailer.createTransport({
   host: process.env.MAIL_HOST,
   port: process.env.MAIL_PORT,
   secure: process.env.MAIL_SECURE === 'true', // secure:true for port 465, secure:false for port 587
   auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
   },
});

const defaultOptions = {
   from: `"${process.env.NAME}" <${process.env.MAIL_ADDR}>`, // sender address
   subject: 'Something changed', // Subject line
   // to: 'email@example.com', // list of receivers
   // text: 'Hello world ?', // plain text body
   // html: '<b>Hello world ?</b>', // html body
};

function sendChangeMail(to, check) {
   const subject = `Change on ${check.url}`;
   const html = ejs.render(changeTemplate, { check, env: process.env });
   return send({ to, subject, html });
}

function send(specificOptions) {
   const options = { ...defaultOptions, ...specificOptions };

   if (!options.to) throw new Error('No receiver given');
   if (!options.text && !options.html) throw new Error('No content given');

   if (process.env.DEVELOPMENT === 'true') {
      console.log('SEND "%s"\nTO %s\n\n%s', options.subject, options.to, options.text || options.html);
      return Promise.resolve();
   }

   return new Promise((resolve, reject) => {
      transporter.sendMail(options, (error, info) => {
         if (error) reject(error);
         else resolve(info);
      });
   });
}

module.exports = { sendChangeMail, send };
