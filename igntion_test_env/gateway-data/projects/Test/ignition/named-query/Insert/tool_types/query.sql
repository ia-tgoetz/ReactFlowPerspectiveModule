INSERT INTO tool_types (tool_type, description,  is_active ) 
VALUES  (:tool_type , :description , :is_active )
RETURNING tool_type;
