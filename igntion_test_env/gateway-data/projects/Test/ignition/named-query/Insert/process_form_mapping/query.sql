INSERT INTO process_form_mapping (form_id, action_type, equipment_type, part_id)
VALUES (:formId, :actionType, :equipmentType, :partId)
RETURNING mapping_id;