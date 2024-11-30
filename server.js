// server.js

const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const livereload = require('livereload');
const connectLivereload = require('connect-livereload');

const app = express();
const PORT = process.env.PORT || 3000;

const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'src'));

liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
        liveReloadServer.refresh("/");
    }, 100);
});

app.use(connectLivereload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'your_secret_key', // 반드시 안전한 키로 변경하세요
    resave: false,
    saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'src')));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_mysql_user',       // MySQL 사용자명
    password: 'your_mysql_password', // MySQL 비밀번호
    database: 'your_database_name'   // 생성한 데이터베이스명
});


db.connect((err) => {
    if (err) {
        console.error('MySQL 연결 오류:', err);
        process.exit(1);
    }
    console.log('MySQL에 연결되었습니다.');
});


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('DB 조회 오류:', err);
            return res.status(500).send('서버 오류');
        }

        if (results.length === 0) {
            return res.status(401).send('잘못된 사용자명 또는 비밀번호');
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('비밀번호 비교 오류:', err);
                return res.status(500).send('서버 오류');
            }

            if (isMatch) {
                req.session.userId = user.id;
                res.redirect('/dashboard');
            } else {
                res.status(401).send('잘못된 사용자명 또는 비밀번호');
            }
        });
    });
});

app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    res.sendFile(path.join(__dirname, 'src', 'dashboard.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('세션 삭제 오류:', err);
        }
        res.redirect('/login');
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
