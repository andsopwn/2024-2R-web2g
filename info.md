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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

