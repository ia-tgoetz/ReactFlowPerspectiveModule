SELECT 
    cols.column_name, 
    cols.data_type, 
    cols.is_nullable, 
    cols.column_default,
    -- Identifying the Key Type
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PK'
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FK'
        ELSE NULL 
    END AS key_type,
    -- Showing which table a Foreign Key points to
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.columns cols
LEFT JOIN 
    information_schema.key_column_usage kcu 
    ON cols.table_name = kcu.table_name 
    AND cols.column_name = kcu.column_name 
    AND cols.table_schema = kcu.table_schema
LEFT JOIN 
    information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name 
    AND kcu.table_schema = tc.table_schema
LEFT JOIN 
    information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
    AND tc.constraint_type = 'FOREIGN KEY'
WHERE 
    cols.table_name = :tableName 
    AND cols.table_schema = 'public'
ORDER BY 
    cols.ordinal_position;