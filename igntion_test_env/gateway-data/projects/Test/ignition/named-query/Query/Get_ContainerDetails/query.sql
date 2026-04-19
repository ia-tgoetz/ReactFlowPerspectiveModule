SELECT 
    -- 1. Container Details (The Physical Reality)
    wip.container_uuid,
    wip.container_type,
    wip.current_step,
    wip.qty_active,
    wip.status AS container_status,
    
    -- 2. Work Order Details (The Production Plan)
    wo.wo_number,
    wo.target_qty AS wo_target_qty,
    wo.status AS wo_status,
    
    -- 3. Part Master Details (The Engineering Blueprint)
    pm.part_id,
    pm.customer_part_number,
    pm.drawing_number,
    pm.specifications_json,  -- Ignition can parse this directly into a UI property!
    
    -- 4. Customer & Demand Details (Who is this for?)
    po.customer_po_reference,
    c.customer_name

FROM wip_containers wip
-- Traverse up to the Work Order
LEFT JOIN work_orders wo ON wip.wo_number = wo.wo_number
-- Traverse up to the Engineering Data
LEFT JOIN parts_master pm ON wo.part_id = pm.part_id
-- Traverse up to the Demand/PO
LEFT JOIN customer_pos po ON wo.internal_po_id = po.internal_po_id
-- Traverse up to the Customer Master
LEFT JOIN customers c ON po.customer_id = c.customer_id

WHERE wip.container_uuid = :containerUuid;