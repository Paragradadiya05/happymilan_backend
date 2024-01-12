const express = require('express');

const app = express();
const multer = require('multer');
const fileUpload = require('express-fileupload');
// const fileUpload = require('express-fileupload');

app.use(fileUpload());

const upload = multer();
app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post('/stats', upload.single('uploaded_file'), function (req, res) {
  // req.file is the name of your file in the form above, here 'uploaded_file'
  // req.body will hold the text fields, if there were any
  console.log(req.file, req.body);

  res.send('Hello World!');
});

app.post('/upload', function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  console.log('=== var req.files ===>', req.files);
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  const { sampleFile } = req.files;
  const uploadPath = `${__dirname}/somewhere/on/your/server/${sampleFile.name}`;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(uploadPath, function (err) {
    if (err) return res.status(500).send(err);

    res.send('File uploaded!');
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
