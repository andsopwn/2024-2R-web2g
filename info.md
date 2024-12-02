### 테이블명
webp;

## 1. 세팅
``` sql
CREATE DATABASE webp;
USE webp;
```

## 2. 테이블 생성
``` sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(60) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 건물 테이블
CREATE TABLE buildings (
    building_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,  -- 건물 이름 중복 불가
    basement_floors INT DEFAULT 0,
    ground_floors INT NOT NULL
);
-- 건물 임시데이터
INSERT INTO buildings (name, basement_floors, ground_floors) VALUES
    ('농심국제관', 1, 5),
    ('문화스포츠관', 1, 4),
    ('학생회관', 1, 4),
    ('과학기술1관', 1, 4),
    ('과학기술2관', 1, 4),
    ('공공정책관', 1, 5),
    ('석원경상관', 1, 5),
    ('학술정보원', 2, 4),
    ('ICT가속기관', 2, 4),    
    ('산학협력관', 1, 3);
    
-- 호실 테이블
CREATE TABLE rooms (
    room_id INT PRIMARY KEY AUTO_INCREMENT,
    building_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    capacity INT,
    room_type VARCHAR(50) NOT NULL,        -- 'lecture', 'seminar', 'lab' 등
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'occupied', 'maintenance'
    FOREIGN KEY (building_id) REFERENCES buildings(building_id),
    UNIQUE KEY (building_id, room_number)
);
INSERT INTO rooms (building_id, room_number, capacity, room_type, status) VALUES
    -- 과학기술1관 (building_id = 4 가정)
    (4, '201', 40, 'LECTURE', 'available'),    -- 2층 강의실
    (4, '301', 30, 'SEMINAR', 'available'),    -- 3층 세미나실
    (4, '401', 50, 'LECTURE', 'available'),    -- 4층 강의실
    
    -- 과학기술2관 (building_id = 5 가정)
    (5, '201', 45, 'LECTURE', 'available'),    -- 2층 강의실
    (5, '301', 25, 'SEMINAR', 'available'),    -- 3층 세미나실
    (5, '401', 60, 'LECTURE', 'available'),    -- 4층 강의실
    
    -- 농심국제관 (building_id = 1 가정)
    (1, '201', 100, 'LECTURE', 'available'),    -- 2층 대형 강의실
    (1, '301', 30, 'SEMINAR', 'available'),     -- 3층 세미나실
    (1, '401', 40, 'LECTURE', 'available'),     -- 4층 강의실
    (1, '501', 20, 'MEETING', 'available');     -- 5층 회의실

-- 좌석 정보 테이블 수정
CREATE TABLE seats (
    seat_id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    row_num INT NOT NULL,  -- 행 번호 (1=A, 2=B, ...)
    col_num INT NOT NULL,  -- 열 번호 (1,2,3,...)
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    UNIQUE KEY unique_seat_position (room_id, row_num, col_num)  -- 같은 방에서 같은 위치의 좌석 중복 방지
);
INSERT INTO seats (room_id, row_num, col_num, status) VALUES
-- A행 (A-1 ~ A-8)
(4, 1, 1, 'available'),  -- A-1
(4, 1, 2, 'available'),  -- A-2
(4, 1, 3, 'available'),  -- A-3
(4, 1, 4, 'available'),  -- A-4
(4, 1, 5, 'available'),  -- A-5
(4, 1, 6, 'available'),  -- A-6
(4, 1, 7, 'available'),  -- A-7
(4, 1, 8, 'available'),  -- A-8

-- B행 (B-1 ~ B-8)
(4, 2, 1, 'available'),  -- B-1
(4, 2, 2, 'available'),  -- B-2
(4, 2, 3, 'available'),  -- B-3
(4, 2, 4, 'available'),  -- B-4
(4, 2, 5, 'available'),  -- B-5
(4, 2, 6, 'available'),  -- B-6
(4, 2, 7, 'available'),  -- B-7
(4, 2, 8, 'available'),  -- B-8

-- C행 (C-1 ~ C-8)
(4, 3, 1, 'available'),  -- C-1
(4, 3, 2, 'available'),  -- C-2
(4, 3, 3, 'available'),  -- C-3
(4, 3, 4, 'available'),  -- C-4
(4, 3, 5, 'available'),  -- C-5
(4, 3, 6, 'available'),  -- C-6
(4, 3, 7, 'available'),  -- C-7
(4, 3, 8, 'available'),  -- C-8

-- D행 (D-1 ~ D-8)
(4, 4, 1, 'available'),  -- D-1
(4, 4, 2, 'available'),  -- D-2
(4, 4, 3, 'available'),  -- D-3
(4, 4, 4, 'available'),  -- D-4
(4, 4, 5, 'available'),  -- D-5
(4, 4, 6, 'available'),  -- D-6
(4, 4, 7, 'available'),  -- D-7
(4, 4, 8, 'available'),  -- D-8

-- E행 (E-1 ~ E-8)
(4, 5, 1, 'available'),  -- E-1
(4, 5, 2, 'available'),  -- E-2
(4, 5, 3, 'available'),  -- E-3
(4, 5, 4, 'available'),  -- E-4
(4, 5, 5, 'available'),  -- E-5
(4, 5, 6, 'available'),  -- E-6
(4, 5, 7, 'available'),  -- E-7
(4, 5, 8, 'available');  -- E-8
-- 호실 예약 테이블 (행사 주최자용)
CREATE TABLE room_reservations (
    reservation_id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    host_id VARCHAR(10) NOT NULL,  -- student_id를 저장
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (host_id) REFERENCES users(student_id)
);
```

## 3. MySQL 사용자 인증 방식 변경
### 1. MySQL 접속
``` bash
mysql -u root -p
```

### 2. 인증 방식 변경
``` sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'tkdlqj1!';
```

### 3. 변경사항 저장
``` sql
FLUSH PRIVILEGES;
```

