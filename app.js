const express = require("express");
const { createProxyMiddleware } = require('http-proxy-middleware');
require("dotenv").config();
const path = require("path");
const bodyParser = require("body-parser");
const db = require("./config/database");
const Router = require("./routes");

const cors = require("cors");
const app = express();
// Enable CORS for all routes
app.use(cors());
// Parse JSON bodies (for application/json content type)
app.use(bodyParser.json());
// Parse URL-encoded bodies (for application/x-www-form-urlencoded content type)
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const PORT = process.env.PORT || 5001;

app.use(express.static("public"));
app.use("/api", Router);

// Proxy requests to localhost:3000
app.use('/', createProxyMiddleware({ target: 'http://localhost:3000', changeOrigin: true }));

// Start the server on port 80
app.listen(80, () => {
    console.log('Reverse proxy running on port 80');
});
