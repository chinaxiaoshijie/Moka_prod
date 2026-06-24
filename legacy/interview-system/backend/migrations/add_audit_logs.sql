-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  user_id INT DEFAULT NULL COMMENT '操作用户ID',
  username VARCHAR(50) DEFAULT NULL COMMENT '操作用户名',
  user_role VARCHAR(20) DEFAULT NULL COMMENT '用户角色',
  action_type VARCHAR(20) NOT NULL COMMENT '操作类型：create/read/update/delete/login/logout/export/import/upload/send_email',
  resource_type VARCHAR(20) NOT NULL COMMENT '资源类型：candidate/position/interview/feedback/resume/user/export/import',
  resource_id INT DEFAULT NULL COMMENT '资源ID',
  details JSON DEFAULT NULL COMMENT '详细信息JSON',
  ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
  user_agent TEXT DEFAULT NULL COMMENT '用户代理',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_action_type (action_type),
  INDEX idx_resource_type (resource_type),
  INDEX idx_resource_id (resource_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作审计日志表';
