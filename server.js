// 필요한 모듈 import
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session(config.session));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'src')));

// MySQL 연결 설정
const db = mysql.createConnection(config.db);

// 데이터베이스 연결
db.connect(err => {
    if (err) {
        console.error('데이터베이스 연결 실패:', err);
        process.exit(1);
    }
    console.log('데이터베이스 연결 성공');
});

// 인증 미들웨어
const authenticateUser = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.status(401).json({ error: '로그인이 필요합니다.' });
    }
};

// API 라우트
// 사용자 로그인 API
app.post('/login', async (req, res) => {
    const { studentId, password } = req.body;

    try {
        // 사용자 확인
        db.query(
            'SELECT * FROM users WHERE student_id = ?',
            [studentId],
            (err, results) => {
                if (err) {
                    console.error('로그인 조회 오류:', err);
                    return res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
                }

                if (results.length === 0) {
                    return res.status(401).json({ error: '학번 또는 비밀번호가 일치하지 않습니다.' });
                }

                const user = results[0];
                
                // 비밀번호 확인 (실제로는 암호화된 비밀번호를 비교해야 함)
                if (password !== user.password) {
                    return res.status(401).json({ error: '학번 또는 비밀번호가 일치하지 않습니다.' });
                }

                // 세션에 사용자 정보 저장
                req.session.isLoggedIn = true;
                req.session.studentId = user.student_id;
                req.session.userId = user.id;

                res.json({ 
                    message: '로그인 성공',
                    user: {
                        id: user.id,
                        username: user.student_id
                    }
                });
            }
        );
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
    }
});

// 회원가입 API
app.post('/signup', async (req, res) => {
    const { email, studentId, password } = req.body;

    try {
        // 이미 존재하는 사용자인지 확인
        db.query(
            'SELECT * FROM users WHERE student_id = ? OR email = ?',
            [studentId, email],
            (err, results) => {
                if (err) {
                    console.error('회원가입 조회 오류:', err);
                    return res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' });
                }

                if (results.length > 0) {
                    return res.status(400).json({ error: '이미 등록된 학번 또는 이메일입니다.' });
                }

                // 새 사용자 등록
                db.query(
                    'INSERT INTO users (student_id, email, password) VALUES (?, ?, ?)',
                    [studentId, email, password], // 실제로는 비밀번호를 암호화해야 함
                    (err, result) => {
                        if (err) {
                            console.error('회원가입 저장 오류:', err);
                            return res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' });
                        }

                        res.json({ message: '회원가입이 완료되었습니다.' });
                    }
                );
            }
        );
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' });
    }
});
// 메인 페이지 라우트
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'main.html'));
});

// 로그아웃 라우트
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: '로그아웃 처리 중 오류가 발생했습니다.' });
        }
        res.json({ message: '로그아웃 되었습니다.' });
    });
});
// 공간 예약 페이지 라우트
app.get('/space_reservation', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'space_reservation.html'));
});

// 좌석 예약 페이지 라우트
app.get('/seat_reservation', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'seat_reservation.html'));
});

// 내 예약 확인 페이지 라우트
app.get('/my_reservations', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'my_reservation.html'));
});
//  건물 관련 API
app.get('/api/buildings', authenticateUser, (req, res) => {
    db.query(
        'SELECT building_id, name FROM buildings ORDER BY name',
        (err, results) => {
            if (err) {
                console.error('Error:', err);
                return res.status(500).json({ error: '건물 목록 조회 실패' });
            }
            res.json(results);
        }
    );
});

//  층 관련 API
app.get('/api/buildings/:buildingId/floors', authenticateUser, (req, res) => {
    const buildingId = req.params.buildingId;
    db.query(
        'SELECT DISTINCT floor FROM rooms WHERE building_id = ? ORDER BY floor',
        [buildingId],
        (err, results) => {
            if (err) {
                console.error('Error:', err);
                return res.status(500).json({ error: '층 목록 조회 실패' });
            }
            res.json(results);
        }
    );
});

//  호실 관련 API
app.get('/api/rooms/:buildingId/:floor', authenticateUser, (req, res) => {
    const { buildingId, floor } = req.params;
    db.query(
        `SELECT r.room_id, r.room_number, r.capacity, r.room_type, r.status 
         FROM rooms r 
         WHERE r.building_id = ? AND r.floor = ? 
         ORDER BY r.room_number`,
        [buildingId, floor],
        (err, results) => {
            if (err) {
                console.error('Error:', err);
                return res.status(500).json({ error: '호실 목록 조회 실패' });
            }
            res.json(results);
        }
    );
});

// 호실 예약 API
app.post('/api/room-reservations', authenticateUser, (req, res) => {
    const { roomId, date, startTime, endTime } = req.body;
    const hostId = req.session.studentId;
    
    console.log('예약 요청 데이터:', { roomId, date, startTime, endTime, hostId }); // 디버깅용 로그

    // 입력값 검증
    if (!roomId || !date || !startTime || !endTime || !hostId) {
        return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
    }

    // 중복 예약 확인
    db.query(
        `SELECT * FROM room_reservations 
         WHERE room_id = ? 
         AND reservation_date = ? 
         AND ((start_time <= ? AND end_time > ?) 
         OR (start_time < ? AND end_time >= ?))`,
        [roomId, date, endTime, startTime, endTime, startTime],
        (err, results) => {
            if (err) {
                console.error('예약 확인 중 오류:', err);
                return res.status(500).json({ error: '예약 확인 중 오류가 발생했습니다.' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ error: '해당 시간에 이미 예약이 존재합니다.' });
            }
            
            // 새 예약 생성
            db.query(
                `INSERT INTO room_reservations 
                 (room_id, host_id, reservation_date, start_time, end_time) 
                 VALUES (?, ?, ?, ?, ?)`,
                [roomId, hostId, date, startTime, endTime],
                (err, result) => {
                    if (err) {
                        console.error('예약 생성 중 오류:', err);
                        console.error('SQL 에러:', err.sqlMessage); // SQL 에러 메시지 출력
                        return res.status(500).json({ error: '예약 생성에 실패했습니다.' });
                    }
                    
                    res.json({ 
                        success: true,
                        message: '예약이 성공적으로 완료되었습니다.',
                        reservationId: result.insertId 
                    });
                }
            );
        }
    );
});
//  예약 조회 API
app.get('/api/room-reservations', authenticateUser, (req, res) => {
    const hostId = req.session.studentId;
    
    db.query(
        `SELECT rr.*, r.room_number, b.name as building_name 
         FROM room_reservations rr
         JOIN rooms r ON rr.room_id = r.room_id
         JOIN buildings b ON r.building_id = b.building_id
         WHERE rr.host_id = ?
         ORDER BY rr.reservation_date DESC, rr.start_time DESC`,
        [hostId],
        (err, results) => {
            if (err) {
                console.error('예약 조회 중 오류:', err);
                return res.status(500).json({ error: '예약 조회 실패' });
            }
            res.json(results);
        }
    );
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});