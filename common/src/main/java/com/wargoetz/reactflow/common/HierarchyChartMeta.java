package com.wargoetz.reactflow.common;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.BrowserResource;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;
import java.util.Set;

public class HierarchyChartMeta {

    public static final String COMPONENT_ID = "com.wargoetz.reactflow.hierarchychart";
    public static final String MODULE_ID = "com.wargoetz.reactflow";

    // Create its own resources instead of sharing
    public static final BrowserResource JS_RESOURCE = new BrowserResource(
        "hierarchychart-js", // Unique ID for this component
        "/res/" + MODULE_ID + "/HierarchyChartClient.js", 
        BrowserResource.ResourceType.JS
    );

    public static final BrowserResource CSS_RESOURCE = new BrowserResource(
        "hierarchychart-css", // Unique ID for this component
        "/res/" + MODULE_ID + "/HierarchyChartClient.css",
        BrowserResource.ResourceType.CSS
    );

    public static final ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
            .setId(COMPONENT_ID)
            .setModuleId(MODULE_ID)
            .setPaletteCategory("WARGoetz")
            .setName("Hierarchy Chart")
            .addPaletteEntry("", "Hierarchy Chart", "Visualizes hierarchical process flows.", null, null)
            .setDefaultMetaName("HierarchyChart")
            .setResources(Set.of(JS_RESOURCE, CSS_RESOURCE)) // Uses local resources
            .setSchema(JsonSchema.parse(HierarchyChartMeta.class.getResourceAsStream("/hierarchychart.props.json")))
            .build();
}