

INSERT INTO roles (role_name)
SELECT r.role_name
FROM (VALUES
    ('access_admin'),
    ('team_lead'),
    ('todo_user')
) AS r(role_name)
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE roles.role_name = r.role_name
);

INSERT INTO statuses (status_name)
SELECT s.status_name
FROM (VALUES
    ('open'),
    ('closed'),
    ('todo'),
    ('in-progress'),
    ('discarded')
) AS s(status_name)
WHERE NOT EXISTS (
  SELECT 1 FROM statuses WHERE statuses.status_name = s.status_name
);