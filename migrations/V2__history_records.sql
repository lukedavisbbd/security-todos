CREATE OR REPLACE FUNCTION log_task_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO history (task_id, status_id, assigned_to_id, timestamp)
        VALUES (NEW.task_id, NEW.status_id, NEW.assigned_to_id, NOW());
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        IF (OLD.status_id IS DISTINCT FROM NEW.status_id) OR 
           (OLD.assigned_to_id IS DISTINCT FROM NEW.assigned_to_id) THEN
            INSERT INTO history (task_id, status_id, assigned_to_id, timestamp)
            VALUES (NEW.task_id, NEW.status_id, NEW.assigned_to_id, NOW());
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_history_insert_trigger
    AFTER INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_history();

CREATE TRIGGER task_history_update_trigger
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_history();