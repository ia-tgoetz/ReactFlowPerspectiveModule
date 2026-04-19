INSERT INTO traceability_log (wo_number, action_type, parent_id, child_id, equipment_id, tool_id, quantity_moved, performed_by)
VALUES (:woNumber, :actionType, :parentId, :childId, :equipmentId, :toolId, :qtyMoved, :performedBy)
RETURNING log_id;