// AI-DOCUMENTS-TOOL/frontend/src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
      /**
       * /api/... on the frontend -> /... on FastAPI
       * e.g. /api/ping -> /ping
       *      /api/extract_clause_titles/ -> /extract_clause_titles/
       */
      pathRewrite: { '^/api': '' },
    })
  );
};
