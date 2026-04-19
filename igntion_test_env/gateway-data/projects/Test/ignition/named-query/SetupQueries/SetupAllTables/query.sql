---------------------------------------------------------
-- OPTIONAL RESET (Uncomment to wipe the schema for testing)
---------------------------------------------------------
/*
DROP TABLE IF EXISTS process_data_json CASCADE;
DROP TABLE IF EXISTS traceability_log CASCADE;
DROP TABLE IF EXISTS wip_containers CASCADE;
DROP TABLE IF EXISTS finished_goods CASCADE;
DROP TABLE IF EXISTS raw_inventory CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS customer_pos CASCADE;
DROP TABLE IF EXISTS process_form_mapping CASCADE;
DROP TABLE IF EXISTS tooling CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS tool_types CASCADE;
DROP TABLE IF EXISTS equipment_types CASCADE;
DROP TABLE IF EXISTS form_definitions CASCADE;
DROP TABLE IF EXISTS parts_master CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

DROP SEQUENCE IF EXISTS cust_seq;
DROP SEQUENCE IF EXISTS part_seq;
DROP SEQUENCE IF EXISTS equip_seq;
DROP SEQUENCE IF EXISTS tool_seq;
DROP SEQUENCE IF EXISTS po_seq;
DROP SEQUENCE IF EXISTS wo_seq;
DROP SEQUENCE IF EXISTS rml_seq;
DROP SEQUENCE IF EXISTS fg_seq;
*/

---------------------------------------------------------
-- BUCKET 1: MASTER DATA (The Blueprint)
---------------------------------------------------------

-- 1A. Lookup Tables (Must be created first)
CREATE TABLE equipment_types (
    equipment_type VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE tool_types (
    tool_type VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

-- 1B. Master Reference Data
CREATE SEQUENCE cust_seq START 100;
CREATE TABLE customers (
    customer_id VARCHAR(50) PRIMARY KEY DEFAULT 'CUST-' || nextval('cust_seq'),
    customer_name VARCHAR(100) NOT NULL,
    customers_attributes_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE part_seq START 1000;
CREATE TABLE parts_master (
    part_id VARCHAR(50) PRIMARY KEY DEFAULT 'PART-' || nextval('part_seq'),
    customer_part_number VARCHAR(100) NOT NULL, -- The external drawing/part name
    drawing_number VARCHAR(50), 
    specifications_json JSONB NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE equip_seq START 100;
CREATE TABLE equipment (
    equipment_id VARCHAR(50) PRIMARY KEY DEFAULT 'EQ-' || nextval('equip_seq'),        
    equipment_name VARCHAR(100) NOT NULL, -- The name painted on the machine (e.g., PRS-01)
    equipment_type VARCHAR(50) NOT NULL,         
    description VARCHAR(255),                    
    is_active BOOLEAN DEFAULT TRUE,
    equipment_attributes_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_equip_type_ref FOREIGN KEY (equipment_type) REFERENCES equipment_types(equipment_type)
);

CREATE SEQUENCE tool_seq START 1000;
CREATE TABLE tooling (
    tool_id VARCHAR(50) PRIMARY KEY DEFAULT 'TOOL-' || nextval('tool_seq'),
    tool_name VARCHAR(100) NOT NULL,
    tool_type VARCHAR(50) NOT NULL, 
    description VARCHAR(255),    
    tool_attributes_json JSONB NOT NULL, 
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tool_type_ref FOREIGN KEY (tool_type) REFERENCES tool_types(tool_type)
);

CREATE TABLE form_definitions (
    form_id SERIAL PRIMARY KEY,
    form_name VARCHAR(100) NOT NULL, 
    description VARCHAR(255),
    form_schema_json JSONB NOT NULL, 
    version INT DEFAULT 1,           
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE process_form_mapping (
    mapping_id SERIAL PRIMARY KEY,
    form_id INT,
    action_type VARCHAR(50),      
    equipment_type VARCHAR(50),   
    part_id VARCHAR(50),
    CONSTRAINT fk_mapping_form FOREIGN KEY (form_id) REFERENCES form_definitions(form_id),
    CONSTRAINT fk_mapping_part FOREIGN KEY (part_id) REFERENCES parts_master(part_id),
    CONSTRAINT fk_mapping_equip_type FOREIGN KEY (equipment_type) REFERENCES equipment_types(equipment_type)
);


---------------------------------------------------------
-- BUCKET 2: ORDER PROCESSING (The Demand)
---------------------------------------------------------

CREATE SEQUENCE po_seq START 5000;
CREATE TABLE customer_pos (
    internal_po_id VARCHAR(50) PRIMARY KEY DEFAULT 'PO-' || nextval('po_seq'),
    customer_po_reference VARCHAR(100) NOT NULL, -- The customer's actual PO string
    customer_id VARCHAR(50),
    part_id VARCHAR(50),
    qty_required DECIMAL(10,2),
    date_due DATE,
    CONSTRAINT fk_po_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT fk_po_part FOREIGN KEY (part_id) REFERENCES parts_master(part_id)
);

CREATE SEQUENCE wo_seq START 1000;
CREATE TABLE work_orders (
    wo_number VARCHAR(50) PRIMARY KEY DEFAULT 'WO-' || nextval('wo_seq'),
    internal_po_id VARCHAR(50),
    part_id VARCHAR(50),
    target_qty DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Created',
    CONSTRAINT fk_wo_po FOREIGN KEY (internal_po_id) REFERENCES customer_pos(internal_po_id),
    CONSTRAINT fk_wo_part FOREIGN KEY (part_id) REFERENCES parts_master(part_id)
);


---------------------------------------------------------
-- BUCKET 3: INVENTORY (The Physical Shelf Stock)
---------------------------------------------------------

CREATE SEQUENCE rml_seq START 1000;
CREATE TABLE raw_inventory (
    rm_lot_id VARCHAR(50) PRIMARY KEY DEFAULT 'RML-' || nextval('rml_seq'),
    vendor_lot_number VARCHAR(100) NOT NULL, -- The barcode on the vendor's bag
    material_id VARCHAR(50),
    inventory_attributes_json JSONB,
    qty_on_hand DECIMAL(10,4),
    date_received TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE fg_seq START 1000;
CREATE TABLE finished_goods (
    fg_lot_number VARCHAR(50) PRIMARY KEY DEFAULT 'FG-' || nextval('fg_seq'), 
    part_id VARCHAR(50),
    wo_number VARCHAR(50),
    qty_ready DECIMAL(10,2),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fg_part FOREIGN KEY (part_id) REFERENCES parts_master(part_id),
    CONSTRAINT fk_fg_wo FOREIGN KEY (wo_number) REFERENCES work_orders(wo_number)
);


---------------------------------------------------------
-- BUCKET 4: WIP & TRACEABILITY (The Floor Operations)
---------------------------------------------------------

CREATE TABLE wip_containers (
    container_uuid VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    wo_number VARCHAR(50),
    current_step VARCHAR(50),    
    container_type VARCHAR(50),  
    qty_active DECIMAL(10,4),
    status VARCHAR(50) DEFAULT 'Active',
    CONSTRAINT fk_wip_wo FOREIGN KEY (wo_number) REFERENCES work_orders(wo_number)
);

CREATE TABLE traceability_log (
    log_id SERIAL PRIMARY KEY,
    wo_number VARCHAR(50),
    action_type VARCHAR(50),  
    parent_id VARCHAR(50),    -- Will store the UUID or RML ID string
    child_id VARCHAR(50),     -- Will store the UUID or FG string
    equipment_id VARCHAR(50), 
    tool_id VARCHAR(50),      
    quantity_moved DECIMAL(10,4),
    performed_by VARCHAR(100),
    transaction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trace_wo FOREIGN KEY (wo_number) REFERENCES work_orders(wo_number),
    CONSTRAINT fk_trace_equip FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id),
    CONSTRAINT fk_trace_tool FOREIGN KEY (tool_id) REFERENCES tooling(tool_id)
);

CREATE TABLE process_data_json (
    data_id SERIAL PRIMARY KEY,
    container_uuid VARCHAR(36),
    wo_number VARCHAR(50),
    form_id INT, 
    payload_json JSONB NOT NULL,
    submitted_by VARCHAR(100),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_json_uuid FOREIGN KEY (container_uuid) REFERENCES wip_containers(container_uuid),
    CONSTRAINT fk_json_wo FOREIGN KEY (wo_number) REFERENCES work_orders(wo_number),
    CONSTRAINT fk_json_form FOREIGN KEY (form_id) REFERENCES form_definitions(form_id)
);


---------------------------------------------------------
-- PERFORMANCE INDEXES
---------------------------------------------------------

-- GIN Indexes for dynamic attributes
CREATE INDEX idx_customers_json ON customers USING GIN (customers_attributes_json);
CREATE INDEX idx_parts_specs ON parts_master USING GIN (specifications_json);
CREATE INDEX idx_equip_json ON equipment USING GIN (equipment_attributes_json);
CREATE INDEX idx_tool_json ON tooling USING GIN (tool_attributes_json);
CREATE INDEX idx_raw_inv_json ON raw_inventory USING GIN (inventory_attributes_json);
CREATE INDEX idx_json_payload ON process_data_json USING GIN (payload_json);

-- **NEW**: Indexes for the external string references (Crucial for Operator Search speed)
CREATE INDEX idx_parts_ref ON parts_master(customer_part_number);
CREATE INDEX idx_equip_ref ON equipment(equipment_name);
CREATE INDEX idx_po_ref ON customer_pos(customer_po_reference);
CREATE INDEX idx_rml_ref ON raw_inventory(vendor_lot_number);

-- Master Data / Structural Lookups
CREATE INDEX idx_equip_type ON equipment(equipment_type);
CREATE INDEX idx_tooling_type ON tooling(tool_type);
CREATE INDEX idx_form_mapping ON process_form_mapping(action_type, equipment_type, part_id);

-- Order & Inventory Linking Lookups
CREATE INDEX idx_po_customer ON customer_pos(customer_id);
CREATE INDEX idx_po_part ON customer_pos(part_id);
CREATE INDEX idx_wo_po ON work_orders(internal_po_id);
CREATE INDEX idx_wo_part ON work_orders(part_id);
CREATE INDEX idx_raw_material ON raw_inventory(material_id);
CREATE INDEX idx_fg_wo ON finished_goods(wo_number);
CREATE INDEX idx_fg_part ON finished_goods(part_id);

-- WIP & Traceability Heavy Lifters
CREATE INDEX idx_wip_wo ON wip_containers(wo_number);
CREATE INDEX idx_wip_status ON wip_containers(status);
CREATE INDEX idx_trace_child ON traceability_log(child_id);
CREATE INDEX idx_trace_parent ON traceability_log(parent_id);
CREATE INDEX idx_trace_wo ON traceability_log(wo_number);
CREATE INDEX idx_trace_equip ON traceability_log(equipment_id);
CREATE INDEX idx_trace_tool ON traceability_log(tool_id);
CREATE INDEX idx_trace_user ON traceability_log(performed_by);
CREATE INDEX idx_json_uuid ON process_data_json(container_uuid);
CREATE INDEX idx_json_wo ON process_data_json(wo_number);
CREATE INDEX idx_json_form_used ON process_data_json(form_id);
CREATE INDEX idx_json_user ON process_data_json(submitted_by);