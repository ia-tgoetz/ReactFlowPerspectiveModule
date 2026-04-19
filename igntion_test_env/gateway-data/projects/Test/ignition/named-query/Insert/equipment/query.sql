INSERT INTO equipment (equipment_name, equipment_type, description, is_active, equipment_attributes_json)
VALUES (:equipment_name, :equipment_type, :description, :is_active, CAST(:equipment_attributes_json AS jsonb))
RETURNING equipment_name;