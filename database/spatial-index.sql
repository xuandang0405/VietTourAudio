USE viettuoraudio;

-- Spatial index và index thống kê đã được tạo trực tiếp trong database/schema.sql.
-- File này giữ lại để tương thích với các script cũ.

SHOW INDEX FROM stalls WHERE Key_name = 'idx_stalls_location';
SHOW INDEX FROM pois WHERE Key_name = 'idx_pois_location';
