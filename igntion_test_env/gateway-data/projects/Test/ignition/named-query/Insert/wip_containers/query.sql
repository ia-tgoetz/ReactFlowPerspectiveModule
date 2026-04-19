INSERT INTO wip_containers (wo_number, current_step, container_type, qty_active, status)
VALUES (:woNumber, :currentStep, :containerType, :qtyActive, 'Active')
RETURNING container_uuid;