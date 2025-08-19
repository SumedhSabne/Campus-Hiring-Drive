const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data', 'candidates.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, unique);
  }
});
const upload = multer({ storage });

// Helpers
function readCandidates() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw || '[]');
}
function writeCandidates(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2));
}

// Routes
app.get('/api/candidates', (req, res) => {
  const data = readCandidates();
  res.json(data);
});

app.get('/api/candidates/:id', (req, res) => {
  const data = readCandidates();
  const found = data.find(c => c.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  res.json(found);
});

app.post('/api/candidates', (req, res) => {
  const body = req.body;
  if (!body || !body.name) return res.status(400).json({ error: 'invalid body' });
  const data = readCandidates();
  const id = 'C' + (Date.now()).toString(36);
  const candidate = {
    id,
    name: body.name,
    email: body.email || '',
    branch: body.branch || '',
    cgpa: body.cgpa || '',
    phone: body.phone || '',
    resumePath: body.resumePath || ''
  };
  data.push(candidate);
  writeCandidates(data);
  res.json(candidate);
});

app.post('/api/upload-resume', upload.single('resume'), (req, res) => {
  const candidateId = req.body.candidateId || null;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filePath = path.relative(__dirname, req.file.path);
  // Attach to candidate if id provided
  if (candidateId) {
    const data = readCandidates();
    const found = data.find(c => c.id === candidateId);
    if (found) {
      found.resumePath = path.join('uploads', path.basename(req.file.path));
      writeCandidates(data);
    }
  }
  res.json({ success: true, file: path.join('uploads', path.basename(req.file.path)) });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Campus Hiring backend listening on', PORT));
