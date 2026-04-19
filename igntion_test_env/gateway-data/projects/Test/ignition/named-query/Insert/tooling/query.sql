INSERT INTO tooling (tool_name, tool_type, description, is_active, tool_attributes_json)
VALUES (:tool_name, :tool_type, :description, :is_active, CAST(:tool_attributes_json AS jsonb))
RETURNING tool_name;