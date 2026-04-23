package com.wargoetz.reactflow.common;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.perspective.common.api.BrowserResource;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;
import com.inductiveautomation.perspective.common.api.ComponentEventDescriptor;

import java.util.Set;

public class ArchitectureBuilderMeta {

    public static final String COMPONENT_ID = "com.wargoetz.reactflow.architecturebuilder";
    public static final String MODULE_ID = "com.wargoetz.reactflow";

    public static final BrowserResource JS_RESOURCE = new BrowserResource(
        "architecturebuilder-0-shared-js", 
        "/res/" + MODULE_ID + "/WARGoetzComponents.js", 
        BrowserResource.ResourceType.JS
    );

    public static final BrowserResource DESIGNER_JS_RESOURCE = new BrowserResource(
        "architecturebuilder-1-designer-js", 
        "/res/" + MODULE_ID + "/WARGoetzDesigner.js", 
        BrowserResource.ResourceType.JS
    );

    public static final BrowserResource CSS_RESOURCE = new BrowserResource(
        "architecturebuilder-2-shared-css", 
        "/res/" + MODULE_ID + "/WARGoetzComponents.css",
        BrowserResource.ResourceType.CSS
    );

    public static final ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
        .setId(COMPONENT_ID)
        .setModuleId(MODULE_ID)
        .setPaletteCategory("WARGoetz")
        .setName("Architecture Builder")
        .addPaletteEntry("", "Architecture Builder", "Drag and drop architecture builder.", null, null)
        .setDefaultMetaName("ArchitectureBuilder")
        .setResources(Set.of(JS_RESOURCE, DESIGNER_JS_RESOURCE, CSS_RESOURCE)) 
        .setEvents(Set.of(
                new ComponentEventDescriptor("onNodeClick", "Fired when a node is clicked.", null),
                new ComponentEventDescriptor("onEdgeClick", "Fired when an edge is clicked.", null),
                new ComponentEventDescriptor("onGearClick", "Fired when the gear icon is clicked.", null),
                new ComponentEventDescriptor("onContextMenuAction", "Fired when a context menu option is selected.", null),
                new ComponentEventDescriptor("onPaletteItemClick", "Fired when a palette item is clicked in the sidebar.", null)
            ))                                                              // <-- ADD THIS
        .setSchema(JsonSchema.parse(ArchitectureBuilderMeta.class.getResourceAsStream("/architecturebuilder.props.json")))
        .build();
}