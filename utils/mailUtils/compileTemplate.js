const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const compileTemplate = (templateName, context = {}) => {
  const filePath = path.join(
    __dirname,
    '../../templates',
    `${templateName}.hbs`
  );
  const source = fs.readFileSync(filePath, 'utf8');
  const template = Handlebars.compile(source);
  return template(context);
};

module.exports = compileTemplate;
