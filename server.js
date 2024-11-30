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
    secret: 'tkdlqj1!',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24시간
    }
}));

// 인증 미들웨어 수정
const authenticateUser = (req, res, next) => {
    if (!req.session.userId) {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({ error: '로그인이 필요합니다.' });
        }
        return res.redirect('/login');
    }
    next();
};

app.use('/main.html', authenticateUser);
app.use('/my_reservation.html', authenticateUser);
app.use('/seat_reservation.html', authenticateUser);
app.use('/space_reservation.html', authenticateUser);

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'src')));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       // MySQL 사용자명
    password: 'tkdlqj1!', // MySQL 비밀번호
    database: 'webp'   // 생성한 데이터베이스명
});


db.connect((err) => {
    if (err) {
        console.error('MySQL 연결 오류:', err);
        process.exit(1);
    }
    console.log('MySQL에 연결되었습니다.');
});


app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/main');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    if (req.session.userId) {
        res.redirect('/main');
    } else {
        res.sendFile(path.join(__dirname, 'src', 'index.html'));
    }
});

app.post('/login', (req, res) => {
    const { studentId, studentName } = req.body;
    
    // 세션에 사용자 정보 저장
    req.session.userId = studentId;
    req.session.userName = studentName;
    req.session.isLoggedIn = true;
    
    // 세션 저장 완료 후 응답
    req.session.save((err) => {
        if (err) {
            console.error('세션 저장 오류:', err);
            return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
        }
        res.json({ success: true });
    });
});

app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    res.sendFile(path.join(__dirname, 'src', 'main.html'));
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('세션 삭제 오류:', err);
        }
        res.redirect('/login');
    });
});

app.post('/signup', async (req, res) => {
    const { email, studentId, password } = req.body;

    try {
        // 이미 존재하는 학번인지 확인
        const existingUser = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM users WHERE username = ? OR email = ?', 
                    [studentId, email], 
                    (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (existingUser.length > 0) {
            return res.status(400).json({ error: '이미 등록된 학번 또는 이메일입니다.' });
        }

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 등록
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(query, [studentId, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('회원가입 오류:', err);
                return res.status(500).json({ error: '서버 오류' });
            }
            res.json({ success: true, message: '회원가입이 완료되었습니다.' });
        });

    } catch (error) {
        console.error('회원가입 처리 오류:', error);
        res.status(500).json({ error: '서버 오류' });
    }
});

// 보호된 경로에 대한 라우트 추가
app.get('/main', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'main.html'));
});

app.get('/my-reservation', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'my_reservation.html'));
});

app.get('/seat-reservation', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'seat_reservation.html'));
});

app.get('/space-reservation', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'space_reservation.html'));
});

// 세션 체크 API 엔드포인트 추가
app.get('/api/check-session', (req, res) => {
    res.json({ isLoggedIn: !!req.session.userId });
});

// 세션 체크 미들웨어 수정
const checkAuth = (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        next();
    } else {
        res.status(401).json({ error: '로그인이 필요합니다.' });
    }
};

// API 라우트에 미들웨어 적용
app.use('/api/*', checkAuth);

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
