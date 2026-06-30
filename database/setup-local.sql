SOURCE database/schema.sql;

CREATE USER IF NOT EXISTS 'viettour_user'@'localhost' IDENTIFIED BY 'viettour_password';
ALTER USER 'viettour_user'@'localhost' IDENTIFIED BY 'viettour_password';
GRANT ALL PRIVILEGES ON viettuoraudio.* TO 'viettour_user'@'localhost';
FLUSH PRIVILEGES;
