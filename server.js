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
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// 인증 미들웨어 개선
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(401).json({ error: '로그인이 필요합니다.' });
        }
        return res.redirect('/');
    }
    next();
};

// 로그인 상태 확인 미들웨어
const checkLoginStatus = (req, res, next) => {
    if (req.session.userId && req.path === '/') {
        return res.redirect('/main');
    }
    next();
};

// 정적 파일 라우팅 전에 인증 미들웨어 적용
app.get('/', checkLoginStatus, (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// 보호된 경로 설정
const protectedPaths = [
    '/main',
    '/space-reservation',
    '/seat-reservation',
    '/my-reservation'
];

// 보호된 경로에 대한 인증 미들웨어 적용
protectedPaths.forEach(path => {
    app.get(path, requireAuth, (req, res) => {
        const fileName = path === '/main' ? 'main.html' : 
                        path.substring(1) + '.html';
        res.sendFile(path.join(__dirname, 'src', fileName));
    });
});

// API 엔드포인트에 대한 인증 미들웨어
app.use('/api', requireAuth);

// 로그인 처리
app.post('/login', async (req, res) => {
    const { studentId, password } = req.body;
    
    try {
        // DB에서 사용자 확인 로직
        const user = await checkUserCredentials(studentId, password);
        if (user) {
            req.session.userId = user.id;
            req.session.studentId = studentId;
            res.json({ success: true, redirect: '/main' });
        } else {
            res.status(401).json({ error: '잘못된 로그인 정보입니다.' });
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 로그아웃 처리
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('로그아웃 오류:', err);
            return res.status(500).json({ error: '로그아웃 처리 중 오류가 발생했습니다.' });
        }
        res.redirect('/');
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
