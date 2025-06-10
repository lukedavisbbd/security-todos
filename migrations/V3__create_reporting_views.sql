-- View: Team task status summary
-- Shows count of tasks in each status for each team
CREATE OR REPLACE VIEW team_task_status_summary AS
SELECT 
    tm.team_id,
    s.status_id,
    s.status_name,
    COUNT(t.task_id)::int AS task_count
FROM teams tm
CROSS JOIN statuses s
LEFT JOIN tasks t 
    ON tm.team_id = t.team_id 
    AND s.status_id = t.status_id
GROUP BY tm.team_id, s.status_id, s.status_name
ORDER BY tm.team_id, s.status_name;


-- View: Team member task summary
-- Shows task counts and average duration for each member by status
CREATE OR REPLACE VIEW team_member_task_summary AS
SELECT 
    tm.team_id,
    u.user_id,
    u.name AS member_name,
    u.email AS member_email,
    s.status_id,
    s.status_name,
    COUNT(t.task_id)::int AS task_count,
    COALESCE(
        AVG(
            CASE 
                WHEN latest_history.timestamp IS NOT NULL
                THEN EXTRACT(EPOCH FROM (NOW() - latest_history.timestamp)) / 86400
                ELSE NULL
            END
        ), 
        0
    )::float AS avg_days_held
FROM teams tm
JOIN user_teams ut ON tm.team_id = ut.team_id
JOIN users u ON ut.user_id = u.user_id
CROSS JOIN statuses s
LEFT JOIN tasks t 
    ON t.team_id = tm.team_id 
    AND t.assigned_to_id = u.user_id 
    AND t.status_id = s.status_id
LEFT JOIN (
    SELECT DISTINCT ON (h.task_id)
        h.task_id,
        h.timestamp,
        h.status_id,
        h.assigned_to_id
    FROM history h
    ORDER BY h.task_id, h.timestamp DESC
) latest_history 
    ON latest_history.task_id = t.task_id 
    AND latest_history.status_id = t.status_id 
    AND latest_history.assigned_to_id = t.assigned_to_id
GROUP BY tm.team_id, u.user_id, u.name, u.email, s.status_id, s.status_name
ORDER BY tm.team_id, u.name, s.status_name;

-- View: Team member overall stats
-- Shows overall task counts and performance for each team member
CREATE OR REPLACE VIEW team_member_overall_stats AS
SELECT 
    tm.team_id,
    u.user_id,
    u.name AS member_name,
    u.email AS member_email,
    COUNT(t.task_id)::int AS total_tasks,
    COUNT(CASE WHEN s.status_name ILIKE ANY (ARRAY['closed', 'done', 'completed']) THEN 1 END)::int AS completed_tasks,
    COUNT(CASE WHEN s.status_name ILIKE ANY (ARRAY['in-progress', 'todo', 'open']) THEN 1 END)::int AS active_tasks,
    COALESCE(
        AVG(
            CASE 
                WHEN latest_history.timestamp IS NOT NULL
                THEN EXTRACT(EPOCH FROM (NOW() - latest_history.timestamp)) / 86400
                ELSE NULL
            END
        ), 
        0
    )::float AS avg_days_per_task
FROM teams tm
JOIN user_teams ut ON tm.team_id = ut.team_id
JOIN users u ON ut.user_id = u.user_id
LEFT JOIN tasks t 
    ON t.team_id = tm.team_id 
    AND t.assigned_to_id = u.user_id
LEFT JOIN statuses s ON t.status_id = s.status_id
LEFT JOIN (
    SELECT DISTINCT ON (h.task_id)
        h.task_id,
        h.timestamp,
        h.status_id,
        h.assigned_to_id
    FROM history h
    ORDER BY h.task_id, h.timestamp DESC
) latest_history 
    ON latest_history.task_id = t.task_id 
    AND latest_history.status_id = t.status_id 
    AND latest_history.assigned_to_id = t.assigned_to_id
GROUP BY tm.team_id, u.user_id, u.name, u.email
ORDER BY tm.team_id, u.name;


-- View: Team overview statistics
-- High-level team metrics and summary data
CREATE OR REPLACE VIEW team_overview_stats AS
SELECT 
    tm.team_id,
    tm.team_name,
    tm.team_owner_id,
    owner.name AS owner_name,
    COUNT(DISTINCT ut.user_id)::int AS total_members,
    COUNT(DISTINCT t.task_id)::int AS total_tasks,
    COUNT(DISTINCT CASE WHEN s.status_name ILIKE ANY (ARRAY['closed', 'done', 'completed']) THEN t.task_id END)::int AS completed_tasks,
    COUNT(DISTINCT CASE WHEN s.status_name ILIKE ANY (ARRAY['in-progress', 'todo', 'open']) THEN t.task_id END)::int AS active_tasks,
    COUNT(DISTINCT CASE WHEN t.assigned_to_id IS NULL THEN t.task_id END)::int AS unassigned_tasks,
    COALESCE(
        ROUND(
            100.0 * COUNT(DISTINCT CASE WHEN s.status_name ILIKE ANY (ARRAY['closed', 'done', 'completed']) THEN t.task_id END) 
            / NULLIF(COUNT(DISTINCT t.task_id), 0), 
            1
        ), 
        0
    )::float AS completion_percentage
FROM teams tm
JOIN users owner ON tm.team_owner_id = owner.user_id
LEFT JOIN user_teams ut ON tm.team_id = ut.team_id
LEFT JOIN tasks t ON tm.team_id = t.team_id
LEFT JOIN statuses s ON t.status_id = s.status_id
GROUP BY tm.team_id, tm.team_name, tm.team_owner_id, owner.name
ORDER BY tm.team_name;
