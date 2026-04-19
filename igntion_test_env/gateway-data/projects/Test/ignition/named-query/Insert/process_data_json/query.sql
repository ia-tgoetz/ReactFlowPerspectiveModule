INSERT INTO process_data_json (container_uuid, wo_number, form_id, payload_json, submitted_by)
VALUES (:containerUuid, :woNumber, :formId, CAST(:payloadJson AS jsonb), :submittedBy)
RETURNING data_id;