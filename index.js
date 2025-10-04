const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

async function startServer() {
  // Serve static files from public directory
  app.use(express.static('public'));

  // Serve node_modules for ES module imports
  app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
  });

  app.listen(port, () => {
    console.log(`Portfolio app listening at http://localhost:${port}`);
    console.log(`Open your browser and navigate to http://localhost:${port}`);
  });
}

startServer();