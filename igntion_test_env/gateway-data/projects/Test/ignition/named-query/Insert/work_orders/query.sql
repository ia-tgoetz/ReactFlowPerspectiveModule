INSERT INTO work_orders (internal_po_id, part_id, target_qty, status)
VALUES (:internalPoId, :partId, :targetQty, 'Created')
RETURNING wo_number;