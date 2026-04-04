package com.wargoetz.schema.common;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.BrowserResource;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;

import java.util.Set;

public class DatabaseSchemaMeta {

    public static final String COMPONENT_ID = "wargoetz.display.databaseschema";
    public static final String MODULE_ID = "com.wargoetz.databaseschema";

    public static final BrowserResource JS_RESOURCE = new BrowserResource(
        "databaseschema-client-js",
        "/res/com.wargoetz.databaseschema/DatabaseSchemaClient.js",
        BrowserResource.ResourceType.JS
    );

    // 1. ADD THE CSS RESOURCE
    public static final BrowserResource CSS_RESOURCE = new BrowserResource(
        "databaseschema-client-css",
        "/res/com.wargoetz.databaseschema/DatabaseSchemaClient.css",
        BrowserResource.ResourceType.CSS
    );

    public static final ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
            .setId(COMPONENT_ID)
            .setModuleId(MODULE_ID)
            .setPaletteCategory("Display")
            .setName("Database Schema")
            .addPaletteEntry("", "Database Schema", "Visualizes SQL Historian schemas.", null, null)
            .setDefaultMetaName("dbSchema")
            // 2. MAKE SURE BOTH JS AND CSS ARE REGISTERED HERE:
            .setResources(Set.of(JS_RESOURCE, CSS_RESOURCE))
            .setSchema(JsonSchema.parse(DatabaseSchemaMeta.class.getResourceAsStream("/databaseschema.props.json")))
            .build();
}