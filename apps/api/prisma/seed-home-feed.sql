INSERT OR IGNORE INTO users (id, name, email, password_hash, avatar_url, created_at, updated_at)
VALUES
  ('seed-user-frans', 'Frans Maylandgo Saragih', 'frans.seed@example.com', NULL, NULL, '2026-05-18 08:00:00', '2026-05-18 08:00:00'),
  ('seed-user-dzaky', 'Dzaky Mubarak', 'dzaky.seed@example.com', NULL, NULL, '2026-05-18 08:05:00', '2026-05-18 08:05:00'),
  ('seed-user-ghina', 'Ghina Audhiya Khairunisa', 'ghina.seed@example.com', NULL, NULL, '2026-05-18 08:10:00', '2026-05-18 08:10:00');

INSERT OR IGNORE INTO posts (id, user_id, content, created_at, updated_at)
VALUES
  (
    'seed-post-setup-aws',
    'seed-user-frans',
    'Backend sudah berjalan di AWS Lambda dan frontend sudah dipublikasikan melalui S3. Feed ini berasal dari database Turso.',
    '2026-05-18 09:00:00',
    '2026-05-18 09:00:00'
  ),
  (
    'seed-post-home-feed',
    'seed-user-dzaky',
    'Halaman beranda sekarang mengambil data postingan langsung dari endpoint backend /posts/feed.',
    '2026-05-18 09:15:00',
    '2026-05-18 09:15:00'
  ),
  (
    'seed-post-prd-schema',
    'seed-user-ghina',
    'Data dummy ini mengikuti rancangan PRD: users, posts, post_images, comments, likes, notifications, sessions, accounts, dan password_reset_tokens.',
    '2026-05-18 09:30:00',
    '2026-05-18 09:30:00'
  );

INSERT OR IGNORE INTO post_images (id, post_id, image_url, created_at)
VALUES
  ('seed-image-login-1', 'seed-post-setup-aws', '/images/auth/auth-hero.svg', '2026-05-18 09:01:00'),
  ('seed-image-login-2', 'seed-post-home-feed', '/images/auth/auth-hero.svg', '2026-05-18 09:16:00');

INSERT OR IGNORE INTO comments (id, post_id, user_id, content, created_at, updated_at)
VALUES
  ('seed-comment-1', 'seed-post-setup-aws', 'seed-user-dzaky', 'Mantap, deployment backend sudah bisa dicek dari health endpoint.', '2026-05-18 09:05:00', '2026-05-18 09:05:00'),
  ('seed-comment-2', 'seed-post-home-feed', 'seed-user-ghina', 'Feed dari backend sudah siap dipakai untuk halaman beranda.', '2026-05-18 09:20:00', '2026-05-18 09:20:00'),
  ('seed-comment-3', 'seed-post-prd-schema', 'seed-user-frans', 'Struktur database sudah sesuai kebutuhan PRD.', '2026-05-18 09:35:00', '2026-05-18 09:35:00');

INSERT OR IGNORE INTO likes (id, post_id, user_id, created_at)
VALUES
  ('seed-like-1', 'seed-post-setup-aws', 'seed-user-dzaky', '2026-05-18 09:06:00'),
  ('seed-like-2', 'seed-post-setup-aws', 'seed-user-ghina', '2026-05-18 09:07:00'),
  ('seed-like-3', 'seed-post-home-feed', 'seed-user-frans', '2026-05-18 09:21:00'),
  ('seed-like-4', 'seed-post-prd-schema', 'seed-user-dzaky', '2026-05-18 09:36:00');

INSERT OR IGNORE INTO notifications (id, recipient_id, actor_id, post_id, type, is_read, created_at)
VALUES
  ('seed-notification-1', 'seed-user-frans', 'seed-user-dzaky', 'seed-post-setup-aws', 'post_like', false, '2026-05-18 09:06:00'),
  ('seed-notification-2', 'seed-user-dzaky', 'seed-user-ghina', 'seed-post-home-feed', 'post_comment', false, '2026-05-18 09:20:00');
