const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// MySQL 연결 설정
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
});

// 예약 정보 조회 API
app.get('/api/reservations', (req, res) => {
    const { studentId, studentName } = req.query;
    
    const query = `
        SELECT * FROM reservations 
        WHERE student_id = ? AND student_name = ? 
        ORDER BY date DESC
    `;
    
    connection.query(query, [studentId, studentName], (error, results) => {
        if (error) {
            res.status(500).json({ error: '데이터베이스 오류' });
            return;
        }
        res.json(results);
    });
});

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});