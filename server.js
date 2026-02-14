const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs"); // โมดูลสำหรับจัดการไฟล์ (File System)
const path = require("path");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("uploads"));

// --- ส่วนจัดการฐานข้อมูล (JSON File Database) ---
const USERS_FILE = "users.json"; // ชื่อไฟล์ที่จะเก็บข้อมูลสมาชิก
const FILES_RECORD = "file_records.json"; // ชื่อไฟล์เก็บความเป็นเจ้าของไฟล์

// 1. ฟังก์ชันโหลดสมาชิก (Read)
function getUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    // ถ้าไม่มีไฟล์ ให้สร้างใหม่พร้อม Admin เริ่มต้น
    const defaultData = [{ username: "admin", password: "123", role: "admin" }];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  // อ่านไฟล์แล้วแปลงกลับเป็น Array
  const rawData = fs.readFileSync(USERS_FILE);
  return JSON.parse(rawData);
}

// 2. ฟังก์ชันบันทึกสมาชิก (Write) - นี่คือส่วนที่ทำให้ "สมัครได้จริง"
function saveUser(userObj) {
  const users = getUsers(); // ดึงข้อมูลเก่ามาก่อน
  users.push(userObj); // เพิ่มคนใหม่เข้าไป
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); // เขียนทับลงไฟล์เดิม
}

// (แถม) ฟังก์ชันจัดการเจ้าของไฟล์
function getFileRecords() {
  if (!fs.existsSync(FILES_RECORD)) return [];
  return JSON.parse(fs.readFileSync(FILES_RECORD));
}
function saveFileRecord(record) {
  const records = getFileRecords();
  records.push(record);
  fs.writeFileSync(FILES_RECORD, JSON.stringify(records, null, 2));
}

// --- Multer Config ---
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// --- API Routes ---

// API สมัครสมาชิก (Register)
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  // เช็คชื่อซ้ำ
  if (users.find((u) => u.username === username)) {
    return res.json({ success: false, message: "Username นี้มีคนใช้แล้วครับ" });
  }

  // บันทึกลงไฟล์จริง! (ให้เป็น role: user อัตโนมัติ)
  saveUser({ username, password, role: "user" });

  console.log(`New user registered: ${username}`);
  res.json({ success: true, message: "สมัครสมาชิกสำเร็จ! กรุณาล็อกอิน" });
});

// API ล็อกอิน (Login)
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = getUsers(); // อ่านข้อมูลล่าสุดจากไฟล์

  const user = users.find(
    (u) => u.username === username && u.password === password,
  );
  if (user) {
    res.json({ success: true, username: user.username, role: user.role });
  } else {
    res
      .status(401)
      .json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านผิด" });
  }
});

// API Upload
app.post("/upload", upload.single("file"), (req, res) => {
  const owner = req.body.owner || "unknown";
  saveFileRecord({ filename: req.file.filename, owner: owner });
  res.json({
    message: "File uploaded successfully",
    filename: req.file.filename,
  });
});

// API Get Files
app.get("/files", (req, res) => {
  const { role, username } = req.query;
  const records = getFileRecords();

  fs.readdir("uploads", (err, files) => {
    if (err) return res.status(500).json({ error: "Error reading files" });

    let fileList = files;
    if (role !== "admin") {
      const myFiles = records
        .filter((r) => r.owner === username)
        .map((r) => r.filename);
      fileList = files.filter((f) => myFiles.includes(f));
    }
    res.json(fileList);
  });
});

app.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  res.download(filePath);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
