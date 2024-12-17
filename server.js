// server.js

const express = require('express');
const cron = require('node-cron');
const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const livereload = require('livereload');
const connectLivereload = require('connect-livereload');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(connectLivereload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'src'));

liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
        liveReloadServer.refresh("/");
    }, 100);
});

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

//호실 조회api
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

    // 예약된 호실 조회
    const query = `
        SELECT rooms.room_id, rooms.room_number, 
        IF(COUNT(room_reservations.room_id) > 0, 1, 0) AS is_reserved
        FROM rooms 
        LEFT JOIN room_reservations
            ON rooms.room_id = room_reservations.room_id
            AND room_reservations.reservation_date = ?  -- 예약 날짜
            AND (
                (room_reservations.start_time BETWEEN ? AND ?) -- Case 1
                OR (room_reservations.end_time BETWEEN ? AND ?) -- Case 2
                OR (room_reservations.start_time <= ? AND room_reservations.end_time >= ?) -- Case 3
            )
        WHERE rooms.building_id = ? 
            AND LEFT(rooms.room_number, LENGTH(rooms.room_number) - 2) = ?
        GROUP BY rooms.room_id;
    `;

    const queryParams = [
        date,           // 예약 날짜
        startTime, endTime, // Case 1
        startTime, endTime, // Case 2
        startTime, endTime, // Case 3
        buildingId, floor  // 건물 ID와 층 정보
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

//호실 예약 api
app.post('/api/room-reservations', (req, res) => {
    console.log('예약 요청 데이터:', req.body);
    
    const { student_id, reservation_date, start_time, end_time, room_id,} = req.body;

    // 입력값 검증
    if (!student_id || !reservation_date || !start_time || !end_time || !room_id) {
        return res.status(400).json({ 
            success: false, 
            message: '필수 입력값이 누락되었습니다.' 
        });
    }

    const query = `
        INSERT INTO room_reservations 
        (student_id, reservation_date, start_time, end_time, room_id) 
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        student_id,
        reservation_date,
        start_time,
        end_time,
        room_id,
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

// 호실 조회
app.get('/api/rooms', async (req, res) => {
    try {
      // prisma를 사용하지 않고 직접 mysql 쿼리 사용
      const query = 'SELECT room_id, building_id, room_number FROM rooms ORDER BY room_number ASC';
      
      db.query(query, (err, results) => {
        if (err) {
          console.error('방 조회 중 오류 발생:', err);
          return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
        res.json(results);
      });
    } catch (error) {
      console.error('방 조회 중 오류 발생:', error);
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 특정 방의 좌석 정보를 가져오는 API
app.get('/api/seats/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { reservationDate, startTime, endTime } = req.query; // 예약 날짜와 시간을 쿼리로 받기

        console.log('요청된 roomId:', roomId); // roomId 확인

        const query = `
            SELECT 
                seats.seat_id, 
                seats.row_num, 
                seats.col_num, 
                IF(COUNT(seat_reservations.seat_id) > 0, 1, 0) AS is_reserved
            FROM 
                seats
            LEFT JOIN 
                seat_reservations ON seats.seat_id = seat_reservations.seat_id
                AND seat_reservations.reservation_date = ?  -- 예약 날짜
                AND (
                    (seat_reservations.start_time BETWEEN ? AND ?)  -- Case 1: 좌석 예약 시작 시간
                    OR (seat_reservations.end_time BETWEEN ? AND ?)  -- Case 2: 좌석 예약 종료 시간
                    OR (seat_reservations.start_time <= ? AND seat_reservations.end_time >= ?)  -- Case 3: 예약 시간 완전 겹침
                )
            WHERE 
                seats.room_id = ?
            GROUP BY 
                seats.seat_id;
        `;

        db.query(query, [reservationDate, startTime, endTime, startTime, endTime, startTime, endTime, roomId], (err, results) => {
            if (err) {
                console.error('좌석 조회 중 오류 발생:', err);
                return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
            }

            console.log('좌석 조회 결과:', results); // 결과 확인

            if (results.length === 0) {
                return res.status(404).json({ message: '해당 방에 좌석 정보가 없습니다.' });
            }

            res.json(results);
        });
    } catch (error) {
        console.error('좌석 조회 중 오류 발생:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});


// 좌석 예약 API
app.post('/api/seat-reservations', (req, res) => {
    console.log('예약 요청 데이터:', req.body);
    
    const { student_id, reservation_date, start_time, end_time, seat_id, room_id } = req.body;

    // 입력값 검증
    if (!student_id || !reservation_date || !start_time || !end_time || !seat_id || !room_id) {
        return res.status(400).json({ 
            success: false, 
            message: '필수 입력값이 누락되었습니다.' 
        });
    }

    // 예약이 이미 존재하는지 확인하는 쿼리
    const checkQuery = `
        SELECT COUNT(*) as count 
        FROM seat_reservations 
        WHERE seat_id = ? 
        AND room_id = ? 
        AND reservation_date = ? 
        AND ((start_time < ? AND end_time > ?) 
        OR (start_time < ? AND end_time > ?))
    `;

    const values = [
        seat_id,
        room_id,
        reservation_date,
        end_time, start_time,
        start_time, end_time
    ];

    console.log('예약 중복 체크 쿼리:', checkQuery);
    console.log('중복 체크 파라미터:', values);

    db.query(checkQuery, values, (err, results) => {
        if (err) {
            console.error('예약 확인 중 오류:', err);
            return res.status(500).json({ 
                success: false, 
                message: '예약 확인 중 오류가 발생했습니다.',
                error: err.message 
            });
        }

        // 이미 예약이 존재하는 경우
        if (results[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: '이미 예약된 시간입니다.' 
            });
        }

        // 좌석 예약 쿼리
        const insertQuery = `
            INSERT INTO seat_reservations 
            (student_id, reservation_date, start_time, end_time, seat_id, room_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const insertValues = [
            student_id,
            reservation_date,
            start_time,
            end_time,
            seat_id,
            room_id
        ];

        console.log('실행할 쿼리:', insertQuery);
        console.log('쿼리 파라미터:', insertValues);

        db.query(insertQuery, insertValues, (err, result) => {
            if (err) {
                console.error('예약 저장 오류:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: '예약 저장 중 오류가 발생했습니다.',
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
});






// 종료된 예약 상태 업데이트를 주기적으로 실행
//cron.schedule('*/5 * * * * *', () => {
/*    console.log('스케줄 실행: 종료된 예약 상태 업데이트...');
    updateReservationStatus()
        .then(result => {
            console.log('예약 상태 업데이트 완료:', result);
        })
        .catch(err => {
            console.error('스케줄 업데이트 중 오류 발생:', err);
        });
});*/

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
