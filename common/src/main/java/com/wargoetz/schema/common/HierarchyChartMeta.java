package com.wargoetz.schema.common;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.BrowserResource;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;

import java.util.Set;

public class HierarchyChartMeta {

    // 1. Matches your perspective-client.ts
    public static final String COMPONENT_ID = "com.wargoetz.reactFlow.hierarchychart";
    
    // 2. Matches your build.gradle.kts
    public static final String MODULE_ID = "com.wargoetz.reactFlow";

    // 3. The "/res/" paths use the new MODULE_ID to find the Webpack files
    public static final BrowserResource JS_RESOURCE = new BrowserResource(
        "reactflow-client-js", // Just gave this a more generic internal name
        "/res/" + MODULE_ID + "/DatabaseSchemaClient.js", 
        BrowserResource.ResourceType.JS
    );

    public static final BrowserResource CSS_RESOURCE = new BrowserResource(
        "reactflow-client-css",
        "/res/" + MODULE_ID + "/DatabaseSchemaClient.css",
        BrowserResource.ResourceType.CSS
    );

    public static final ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
            .setId(COMPONENT_ID)
            .setModuleId(MODULE_ID)
            .setPaletteCategory("WARGoetz") // Passed directly as a string
            .setName("Hierarchy Chart")
            .addPaletteEntry("", "Hierarchy Chart", "Visualizes hierarchical process flows.", null, null)
            .setDefaultMetaName("HierarchyChart")
            .setResources(Set.of(JS_RESOURCE, CSS_RESOURCE))
            .setSchema(JsonSchema.parse(HierarchyChartMeta.class.getResourceAsStream("/hierarchychart.props.json")))
            .build();
}