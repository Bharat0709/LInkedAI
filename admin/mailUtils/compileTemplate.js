const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const compileTemplate = (templateName, context = {}) => {
  // templateName should include folder structure, e.g., 'admin/help_request'
  const filePath = path.join(
    __dirname,
    '../templates',
    `${templateName}.hbs`
  );
  
  // Check if file exists for better error handling
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template not found: ${filePath}`);
  }
  
  const source = fs.readFileSync(filePath, 'utf8');
  const template = Handlebars.compile(source);
  return template(context);
};

module.exports = compileTemplate;
