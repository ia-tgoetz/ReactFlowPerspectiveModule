INSERT INTO form_definitions (form_name, description, form_schema_json, version, is_active)
VALUES (:formName, :description, CAST(:schemaJson AS jsonb), :version, :isActive)
RETURNING form_id;