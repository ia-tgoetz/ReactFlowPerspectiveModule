INSERT INTO customers (customer_name, customers_attributes_json)
VALUES (:customerName, CAST(:attributesJson AS jsonb))
RETURNING customer_id;