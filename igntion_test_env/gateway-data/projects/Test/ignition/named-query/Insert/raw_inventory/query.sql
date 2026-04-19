INSERT INTO raw_inventory (vendor_lot_number, material_id, inventory_attributes_json, qty_on_hand)
VALUES (:vendorLotNumber, :materialId, CAST(:attributesJson AS jsonb), :qtyOnHand)
RETURNING rm_lot_id;