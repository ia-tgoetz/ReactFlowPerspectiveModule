package com.wargoetz.schema.common;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.BrowserResource;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;

import java.util.Set;

public class DatabaseSchemaMeta {

    public static final String COMPONENT_ID = "wargoetz.display.databaseschema";
    public static final String MODULE_ID = "com.wargoetz.databaseschema";

    // In 8.3, ResourceType is a nested enum: BrowserResource.ResourceType
    public static final BrowserResource JS_RESOURCE = new BrowserResource(
        "databaseschema-client",
        "/res/com.wargoetz.databaseschema/DatabaseSchemaClient.js",
        BrowserResource.ResourceType.JS // Correctly scoped enum
    );

    // Builds the actual descriptor expected by Perspective
    public static final ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
            .setId(COMPONENT_ID)
            .setModuleId(MODULE_ID)
            .setPaletteCategory("Display")
            .setName("Database Schema")
            .setDefaultMetaName("dbSchema")
            .setResources(Set.of(JS_RESOURCE))
            .setSchema(JsonSchema.parse(DatabaseSchemaMeta.class.getResourceAsStream("/databaseschema.props.json")))
            .build();
}