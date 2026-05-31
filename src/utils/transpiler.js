import * as Babel from '@babel/standalone';

/**
 * Transpiles JSX code to browser-executable ES5/ES6 JavaScript.
 * Automatically appends a render call if none is present.
 * @param {string} sourceCode - The raw JSX source code.
 * @returns {Object} { code, error }
 */
export function transpileJsx(sourceCode) {
  if (!sourceCode || sourceCode.trim() === '') {
    return { code: '', error: 'Empty code' };
  }

  try {
    let processedCode = sourceCode;

    // Check if there is any render(...) call in the code
    // Matches patterns like: render(..., render <..., render(<...
    const hasRenderCall = /\brender\s*\(\s*</.test(processedCode) || /\brender\s*</.test(processedCode);

    if (!hasRenderCall) {
      // Look for export default function Name or export default Name
      const exportDefaultMatch = processedCode.match(/export\s+default\s+(?:function\s+)?([a-zA-Z0-9_$]+)/);
      
      if (exportDefaultMatch && exportDefaultMatch[1]) {
        const componentName = exportDefaultMatch[1];
        processedCode += `\n\n// Automatically added by JsxFileReader\nrender(<${componentName} />);`;
      } else {
        // Look for any function that starts with a capital letter (standard React component naming)
        // Matches: function MyComponent(...) or const MyComponent = (...)
        const functionMatch = processedCode.match(/(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9_$]*)\b/);
        if (functionMatch && functionMatch[1]) {
          const componentName = functionMatch[1];
          processedCode += `\n\n// Automatically added by JsxFileReader\nrender(<${componentName} />);`;
        } else {
          // If no capital-letter function, but we have some code, let's check if there is any function defined
          const anyFunctionMatch = processedCode.match(/(?:function|const|let|var)\s+([a-zA-Z0-9_$]+)\b/);
          if (anyFunctionMatch && anyFunctionMatch[1]) {
            const componentName = anyFunctionMatch[1];
            processedCode += `\n\n// Automatically added by JsxFileReader\nrender(<${componentName} />);`;
          }
        }
      }
    }

    // Strip export statements as they cause syntax errors when evaluated in inline scripts
    processedCode = processedCode.replace(/export\s+default\s+/g, '');
    processedCode = processedCode.replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ');
    processedCode = processedCode.replace(/export\s+\{[^}]+\};?/g, '');

    // Replace ESM imports (e.g. import React, { useState } from 'react')
    // Since React, ReactDOM are provided globally in the sandbox, we can remove/comment out these imports
    // or Babel can ignore them, but to make standard JSX files work, we can comment them out or strip them.
    // Let's strip React imports since React is available globally.
    // e.g. import React from 'react'; -> removed
    // e.g. import { useState, useEffect } from 'react'; -> we can extract useState, useEffect and bind them from React global
    processedCode = processedCode.replace(
      /import\s+(?:React\s*,\s*)?({[^}]+})\s*from\s*['"]react['"]/g,
      (match, destructuring) => {
        // Replace: import { useState } from 'react'
        // with: const { useState } = React;
        return `const ${destructuring} = React;`;
      }
    );
    processedCode = processedCode.replace(/import\s+React\b\s*(?:,\s*{[^}]+})?\s*from\s*['"]react['"]/g, '');
    // Strip other react-dom imports
    processedCode = processedCode.replace(/import\s+.*?\s*from\s*['"]react-dom['"]/g, '');
    processedCode = processedCode.replace(/import\s+.*?\s*from\s*['"]react-dom\/client['"]/g, '');

    // Strip all remaining import statements (e.g. lucide-react, shadcn components)
    // to prevent the browser from throwing module resolution errors.
    processedCode = processedCode.replace(/import\s+.*?from\s+['"][^'"]+['"];?/g, '/* stripped import */');

    // Babel transforms the code
    const result = Babel.transform(processedCode, {
      presets: ['react'],
      filename: 'sandbox.jsx',
      parserOpts: {
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true
      }
    });

    return { code: result.code, error: null };
  } catch (err) {
    console.error('Babel compilation error:', err);
    return { code: null, error: err.message || err.toString() };
  }
}
