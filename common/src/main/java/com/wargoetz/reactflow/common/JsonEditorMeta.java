package com.wargoetz.reactflow.common;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.ignition.common.gson.JsonObject; 
import com.inductiveautomation.perspective.common.api.BrowserResource;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;
import java.util.Set;

public class JsonEditorMeta {
    public static final String COMPONENT_ID = "com.wargoetz.reactflow.jsoneditor";
    public static final String MODULE_ID = "com.wargoetz.reactflow";

    // Forces the client bundle to load first 
    public static final BrowserResource JS_RESOURCE = new BrowserResource(
        "jsoneditor-0-shared-js", 
        "/res/" + MODULE_ID + "/WARGoetzComponents.js", 
        BrowserResource.ResourceType.JS
    );

    // Forces the designer bundle to load second
    public static final BrowserResource DESIGNER_JS_RESOURCE = new BrowserResource(
        "jsoneditor-1-designer-js", 
        "/res/" + MODULE_ID + "/WARGoetzDesigner.js", 
        BrowserResource.ResourceType.JS
    );

    public static final ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
            .setId(COMPONENT_ID)
            .setModuleId(MODULE_ID)
            .setPaletteCategory("WARGoetz")
            .setName("JSON Editor")
            .addPaletteEntry("", "JSON Editor", "An interactive JSON viewer and editor.", null, null)
            .setDefaultMetaName("jsonEditor")
            .setResources(Set.of(JS_RESOURCE, DESIGNER_JS_RESOURCE)) 
            .setSchema(JsonSchema.parse(JsonEditorMeta.class.getResourceAsStream("/jsoneditor.props.json")))
            .setDefaultProps(createDefaultProps()) 
            .build();

    private static JsonObject createDefaultProps() {
        JsonObject props = new JsonObject();
        props.add("data", new JsonObject());
        props.addProperty("theme", "monokai");
        props.addProperty("editable", true);
        props.add("style", new JsonObject());

        // IMPORTANT: Empty object means the dropdown theme wins by default.
        props.add("customTheme", new JsonObject()); // No keys = dropdown wins
        
        return props;
    }
}