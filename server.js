const express = require('express'); 
const multer = require('multer'); 
const cors = require('cors'); 
const fs = require('fs'); 
const path = require('path'); 
const app = express(); 
const port = 5000; 
app.use(cors()); // อนุญาตให Frontend เรียกใชงาน 
app.use(express.static('uploads')); // ใหเขาถึงไฟลที่อัปโหลด 
// ตั้งคาที่เก็บไฟลอัปโหลด 
const storage = multer.diskStorage({ 
    destination: 'uploads/', 
    filename: (req, file, cb) => { 
        cb(null, file.originalname); 
    } 
}); 
const upload = multer({ storage }); 
// อัปโหลดไฟลจาก Client -> Server
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); 
});
app.post('/upload', upload.single('file'), (req, res) => { 
    res.json({ message: 'File uploaded successfully', filename: req.file.filename }); 
}); 
// แสดงรายการไฟลที่มีในเซิรฟเวอร 
app.get('/files', (req, res) => { 
    fs.readdir('uploads', (err, files) => { 
        if (err) return res.status(500).json({ error: 'Unable to list files' }); 
        res.json(files); 
    }); 
}); 
// ให Client ดาวนโหลดไฟลจาก Server 
app.get('/download/:filename', (req, res) => { 
    const filePath = path.join(__dirname, 'uploads', req.params.filename); 
    res.download(filePath); 
}); 
// เริ่มเซิรฟเวอร 
app.listen(port, () => { 
    console.log(`Server running at http://localhost:${port}`); 
}); 