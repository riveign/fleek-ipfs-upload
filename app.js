const express = require('express');
const multer = require('multer');
const path = require('path');
const { FleekSdk, PersonalAccessTokenService } = require('@fleekxyz/sdk');
const fs =  require('fs');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');
app.use(cors()); // Enable CORS for all routes

const newAccessTokenService = new PersonalAccessTokenService({ personalAccessToken: process.env.PAT, projectId: process.env.PID });
const newSdk = new FleekSdk({ accessTokenService: newAccessTokenService });

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', upload.single('file'), async (req, res) => {
  
  const { path: filePath, originalname: fileName } = req.file;

  if (!fs.existsSync(filePath)) {
    res.status(500).json({
      success: false,
      message: 'File not found',
    });
  }
  const stat = await fs.promises.stat(filePath);
  const wrapWithDirectory = stat.isDirectory(); 
  
  const uploadedFile = await newSdk.ipfs().addFromPath(filePath, {wrapWithDirectory,});

  fs.unlink(filePath, (err) => {
    if (err) console.error('Error deleting the temporary file:', err.message);
  });
  
  res.json({
      success: true,
      message: 'File uploaded successfully',
      cid: uploadedFile.pop().cid.toString(),
  });
  return;
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

