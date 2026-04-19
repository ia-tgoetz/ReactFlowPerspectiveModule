INSERT INTO parts_master (customer_part_number, drawing_number, specifications_json)
VALUES (:customerPartNumber, :drawingNumber, CAST(:specsJson AS jsonb))
RETURNING part_id;