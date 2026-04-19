INSERT INTO customer_pos (customer_po_reference, customer_id, part_id, qty_required, date_due)
VALUES (:customerPoRef, :customerId, :partId, :qtyRequired, :dateDue)
RETURNING internal_po_id;