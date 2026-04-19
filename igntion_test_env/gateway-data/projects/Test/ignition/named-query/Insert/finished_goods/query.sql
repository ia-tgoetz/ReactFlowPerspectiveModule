INSERT INTO finished_goods (part_id, wo_number, qty_ready)
VALUES (:partId, :woNumber, :qtyReady)
RETURNING fg_lot_number;