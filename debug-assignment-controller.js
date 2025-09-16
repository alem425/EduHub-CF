// Debug script to add temporary logging to the assignment controller

const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, 'src', 'controllers', 'assignmentController.ts');

console.log('🔍 Adding debug logging to assignment controller...');

// Read the current controller
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

// Add debug logging right after the file upload check
const debugCode = `
      // DEBUG: Log request details
      console.log('🔍 DEBUG: Request content-type:', req.headers['content-type']);
      console.log('🔍 DEBUG: Request file:', req.file ? 'exists' : 'none');
      console.log('🔍 DEBUG: Request files:', req.files ? Object.keys(req.files) : 'none');
      console.log('🔍 DEBUG: Body keys:', Object.keys(req.body));
      `;

// Find the line where we check for uploaded files and add debug code before it
const targetLine = '      // Handle file uploads if any';
const replacement = debugCode + '\n      ' + targetLine;

// Replace the target line
controllerContent = controllerContent.replace(targetLine, replacement);

// Write back the modified controller
fs.writeFileSync(controllerPath, controllerContent);

console.log('✅ Debug logging added to assignment controller');
console.log('📝 Now rebuild and redeploy to see the debug output in your Azure logs');
console.log('');
console.log('🔧 Commands to run:');
console.log('1. npm run build');
console.log('2. Deploy to Azure');
console.log('3. Test in Postman again');
console.log('4. Check Azure Application Insights or App Service logs for the debug output');
console.log('');
console.log('⚠️  Remember to remove this debug code after troubleshooting!');
