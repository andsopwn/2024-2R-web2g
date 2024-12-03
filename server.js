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
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// 인증 미들웨어 추가
const authenticateUser = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.status(401).json({ error: '로그인이 필요합니다.' });
    }
};

// 정적 파일 제공 전에 인증 미들웨어 적용
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
    database: 'webp1'   // 생성한 데이터베이스명
});


db.connect((err) => {
    if (err) {
        console.error('MySQL 연결 오류:', err);
        process.exit(1);
    }
    console.log('MySQL에 연결되었습니다.');
});


app.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.post('/login', (req, res) => {
    const { studentId, password } = req.body;

    // 테스트 계정
    if (studentId === '2024112233' && password === 'test') {
        req.session.userId = 'test';
        req.session.studentId = '2024112233';
        req.session.isLoggedIn = true;

        return res.json({
            success: true,
            redirect: '/main',
            user: {
                id: 'test',
                username: '2024112233'
            }
        });
    }
    // 테스트 계정 끝

    // 데이터베이스에서 학번으로 사용자 조회
    const query = 'SELECT * FROM users WHERE student_id = ?';
    db.query(query, [studentId], (err, results) => {
        if (err) {
            console.error('DB 조회 오류:', err);
            return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: '학번 또는 비밀번호가 일치하지 않습니다.' });
        }

        const user = results[0];

        // bcrypt를 사용하여 비밀번호 비교
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('비밀번호 비교 오류:', err);
                return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
            }

            if (isMatch) {
                // 로그인 성공: 세션 설정
                req.session.userId = user.id;
                req.session.studentId = user.student_id;
                req.session.isLoggedIn = true;

                res.json({
                    success: true,
                    redirect: '/main.html',
                    user: {
                        id: user.id,
                        studentId: user.student_id
                    }
                });
            } else {
                // 비밀번호 불일치
                res.status(401).json({ error: '학번 또는 비밀번호가 일치하지 않습니다.' });
            }
        });
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
    const {
        emailLocal,
        emailDomain,
        studentId,
        name,           // 이름 필드 추가
        password
    } = req.body;
    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);
    // 이메일 생성
    const email = `${emailLocal}@${emailDomain}`;

    // 필수 필드 검증 추가
    if (!emailLocal || !emailDomain || !studentId || !name || !password) {
        return res.status(400).json({
            error: '모든 필드를 입력해주세요.',
            receivedData: {
                emailLocal,
                emailDomain,
                studentId,
                name,
                hasPassword: !!password
            }
        });
    }

    try {
        // 이미 존재하는 학번인지만 확인
        const existingUser = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM users WHERE student_id = ?',
                [studentId],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
        });
        if (existingUser.length > 0) {
            return res.status(400).json({ error: '이미 등록된 학번입니다.' });
        }
        // 이름 유효성 검사 부분
        if (!(name.length >= 2) || name.length >= 50) {
            return res.status(400).json({ error: '이름은 2~50자 사이여야 합니다.' });
        }

        if (!/^[가-힣a-zA-Z\s]+$/.test(name)) {
            return res.status(400).json({ error: '이름은 한글 또는 영문만 입력 가능합니다.' });
        }

        // 데이터베이스에 사용자 추가
        db.query(
            'INSERT INTO users (username, student_id, password, email) VALUES (?, ?, ?, ?)',
            [name, studentId, hashedPassword, email],
            (err, result) => {
                if (err) {
                    console.error('회원가입 DB 오류:', err);
                    return res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' });
                }
                res.json({ message: '회원가입이 완료되었습니다.' });
            }
        );

    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.2' });
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

// 세션 체크 API 엔드포인트 수정
app.get('/api/check-session', (req, res) => {
    if (req.session.isLoggedIn) {
        res.json({
            isLoggedIn: true,
            user: {
                id: req.session.userId,
                studentId: req.session.studentId
            }
        });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// 모든 건물 목록 조회
app.get('/api/buildings', (req, res) => {
    const query = 'SELECT building_id, name FROM buildings ORDER BY name';
    db.query(query, (err, results) => {
        if (err) {
            console.error('건물 목록 조회 오류:', err);
            return res.status(500).json({ error: '건물 목록을 가져오는데 실패했습니다.' });
        }
        // 디버깅을 위한 로그
        console.log('조회된 건물 목록:', results);

        res.json(results);
    });
});

// 특정 건물의 정보를 가져오는 API
app.get('/api/buildings/:id', (req, res) => {
    const buildingId = req.params.id;

    const query = 'SELECT building_id, name, basement_floors, ground_floors FROM buildings WHERE building_id = ?';

    db.query(query, [buildingId], (err, results) => {
        if (err) {
            console.error('건물 정보 조회 오류:', err);
            return res.status(500).json({ error: '건물 정보를 가져오는데 실패했습니다.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: '해당 건물을 찾을 수 없습니다.' });
        }

        console.log('건물 정보:', results[0]); // 디버깅용
        res.json(results[0]);
    });
});

app.get('/api/rooms/:buildingId/:floor', (req, res) => {
    const { buildingId, floor } = req.params;
    const { date, startTime, endTime } = req.query;

    console.log('API 요청 받음:', {
        buildingId,
        floor,
        date,
        startTime,
        endTime
    });

    const floorPattern = `${floor}%`;
    console.log('검색할 층 패턴:', floorPattern);

    const query = `
        SELECT r.*, 
            EXISTS (
                SELECT 1 
                FROM room_reservations rr 
                WHERE rr.room_id = r.room_id
                AND rr.reservation_date = ?
                AND (
                    (rr.start_time < ? AND rr.end_time > ?)
                    OR (rr.start_time < ? AND rr.end_time > ?)
                    OR (rr.start_time >= ? AND rr.end_time <= ?)
                )
            ) as is_reserved
        FROM rooms r
        WHERE r.building_id = ? 
        AND r.room_number LIKE ?
        ORDER BY r.room_number
    `;

    const queryParams = [
        date, endTime, startTime, 
        endTime, startTime, 
        startTime, endTime,
        buildingId, floorPattern
    ];

    console.log('실행할 쿼리:', query);
    console.log('쿼리 파라미터:', queryParams);

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('호실 목록 조회 오류:', err);
            return res.status(500).json({ error: '호실 목록을 가져오는데 실패했습니다.' });
        }

        console.log('조회된 호실 수:', results.length);
        console.log('조회된 호실:', results);
        res.json(results);
    });
});


app.post('/api/reserve-space', (req, res) => {
    console.log('예약 요청 데이터:', req.body);
    
    const { student_id, reservation_date, start_time, end_time, room_id, status } = req.body;

    // 입력값 검증
    if (!student_id || !reservation_date || !start_time || !end_time || !room_id) {
        return res.status(400).json({ 
            success: false, 
            message: '필수 입력값이 누락되었습니다.' 
        });
    }

    const query = `
        INSERT INTO room_reservations 
        (student_id, reservation_date, start_time, end_time, room_id, status) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        student_id,
        reservation_date,
        start_time,
        end_time,
        room_id,
        status || '예약불가'
    ];

    console.log('실행할 쿼리:', query);
    console.log('쿼리 파라미터:', values);

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('예약 저장 오류:', err);
            return res.status(500).json({ 
                success: false, 
                message: '예약 처리 중 오류가 발생했습니다.',
                error: err.message
            });
        }

        res.json({ 
            success: true, 
            message: '예약이 완료되었습니다.',
            reservationId: result.insertId 
        });
    });
});

// 좌석 목록 조회 API
app.get('/api/seats/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { date, startTime, endTime } = req.query;

        console.log('받은 요청:', { roomId, date, startTime, endTime });

        // 1. 먼저 room 정보 조회
        const roomQuery = `
            SELECT r.*, b.name as building_name 
            FROM rooms r 
            JOIN buildings b ON r.building_id = b.building_id 
            WHERE r.room_id = ?
        `;

        db.query(roomQuery, [roomId], (err, roomResults) => {
            if (err) {
                console.error('방 정보 조회 오류:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: '방 정보 조회 실패' 
                });
            }

            if (roomResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '해당 방을 찾을 수 없습니다.'
                });
            }

            const room = roomResults[0];

            // 2. 좌석 정보와 예약 정보 조회
            const seatsQuery = `
                SELECT 
                    s.seat_id,
                    s.row_num,
                    s.col_num,
                    s.status,
                    CASE WHEN sr.reservation_id IS NOT NULL THEN TRUE ELSE FALSE END as is_reserved
                FROM 
                    seats s
                    LEFT JOIN seat_reservations sr ON s.seat_id = sr.seat_id
                    AND sr.reservation_date = ?
                    AND sr.status != '예약불가'
                    AND (
                        (sr.start_time <= ? AND sr.end_time > ?)
                        OR (sr.start_time < ? AND sr.end_time >= ?)
                        OR (sr.start_time >= ? AND sr.start_time < ?)
                    )
                WHERE 
                    s.room_id = ?
                ORDER BY 
                    s.row_num, s.col_num
            `;

            const seatsValues = [
                date, 
                endTime, startTime,
                endTime, endTime,
                startTime, endTime,
                roomId
            ];

            db.query(seatsQuery, seatsValues, (err, seatsResults) => {
                if (err) {
                    console.error('좌석 조회 오류:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: '좌석 정보 조회 실패' 
                    });
                }

                // 좌석 정보를 2차원 배열로 변환
                const maxRow = Math.max(...seatsResults.map(seat => seat.row_num));
                const maxCol = Math.max(...seatsResults.map(seat => seat.col_num));

                res.json({
                    success: true,
                    room: {
                        ...room,
                        maxRow,
                        maxCol
                    },
                    seats: seatsResults
                });
            });
        });

    } catch (error) {
        console.error('서버 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 좌석 예약 API
app.post('/api/reserve-seat', (req, res) => {
    console.log('좌석 예약 요청 데이터:', req.body);
    
    const { student_id, reservation_date, start_time, end_time, seat_id, status } = req.body;

    // 입력값 검증
    if (!student_id || !reservation_date || !start_time || !end_time || !seat_id) {
        return res.status(400).json({ 
            success: false, 
            message: '필수 입력값이 누락되었습니다.' 
        });
    }

    const query = `
        INSERT INTO seat_reservations 
        (student_id, reservation_date, start_time, end_time, seat_id, status) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        student_id,
        reservation_date,
        start_time,
        end_time,
        seat_id,
        status || '예약불가'
    ];

    console.log('실행할 쿼리:', query);
    console.log('쿼리 파라미터:', values);

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('좌석 예약 저장 오류:', err);
            return res.status(500).json({ 
                success: false, 
                message: '좌석 예약 처리 중 오류가 발생했습니다.',
                error: err.message
            });
        }

        res.json({ 
            success: true, 
            message: '좌석 예약이 완료되었습니다.',
            reservationId: result.insertId 
        });
    });
});

// 로그아웃 라우트 추가
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('세션 삭제 오류:', err);
            return res.status(500).json({ error: '로그아웃 처리 중 오류가 발생했습니다.' });
        }
        res.json({ success: true });
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
