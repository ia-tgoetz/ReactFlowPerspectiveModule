INSERT INTO  equipment_types (equipment_type, description,  is_active ) 
VALUES  (:equipment_type , :description , :is_active )
RETURNING equipment_type;