package com.wargoetz.reactflow.common;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.BrowserResource;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;
import java.util.Set;

public class HierarchyChartMeta {

    public static final String COMPONENT_ID = "com.wargoetz.reactflow.hierarchychart";
    public static final String MODULE_ID = "com.wargoetz.reactflow";

    // Forces the client bundle to load first 
    public static final BrowserResource JS_RESOURCE = new BrowserResource(
        "hierarchychart-0-shared-js", 
        "/res/" + MODULE_ID + "/WARGoetzComponents.js", 
        BrowserResource.ResourceType.JS
    );

    // Forces the designer bundle to load second
    public static final BrowserResource DESIGNER_JS_RESOURCE = new BrowserResource(
        "hierarchychart-1-designer-js", 
        "/res/" + MODULE_ID + "/WARGoetzDesigner.js", 
        BrowserResource.ResourceType.JS
    );

    // Loads the CSS last
    public static final BrowserResource CSS_RESOURCE = new BrowserResource(
        "hierarchychart-2-shared-css", 
        "/res/" + MODULE_ID + "/WARGoetzComponents.css",
        BrowserResource.ResourceType.CSS
    );

    public static final ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
            .setId(COMPONENT_ID)
            .setModuleId(MODULE_ID)
            .setPaletteCategory("WARGoetz")
            .setName("Hierarchy Chart")
            .addPaletteEntry("", "Hierarchy Chart", "Visualizes hierarchical process flows.", null, null)
            .setDefaultMetaName("HierarchyChart")
            .setResources(Set.of(JS_RESOURCE, DESIGNER_JS_RESOURCE, CSS_RESOURCE)) 
            .setSchema(JsonSchema.parse(HierarchyChartMeta.class.getResourceAsStream("/hierarchychart.props.json")))
            .build();
}