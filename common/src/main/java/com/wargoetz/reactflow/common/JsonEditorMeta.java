package com.wargoetz.reactflow.common;

import com.inductiveautomation.ignition.common.jsonschema.JsonSchema;
import com.inductiveautomation.ignition.common.gson.JsonObject; 
import com.inductiveautomation.perspective.common.api.BrowserResource;
import com.inductiveautomation.perspective.common.api.ComponentDescriptor;
import com.inductiveautomation.perspective.common.api.ComponentDescriptorImpl;
import java.util.Set;

public class JsonEditorMeta {
    public static final String COMPONENT_ID = "com.wargoetz.jsoneditor";
    public static final String MODULE_ID = "com.wargoetz.reactflow";

    public static final BrowserResource JS_RESOURCE = new BrowserResource(
        "jsoneditor-js", 
        "/res/" + MODULE_ID + "/JsonEditorClient.js", 
        BrowserResource.ResourceType.JS
    );

    public static final ComponentDescriptor DESCRIPTOR = ComponentDescriptorImpl.ComponentBuilder.newBuilder()
            .setId(COMPONENT_ID)
            .setModuleId(MODULE_ID)
            .setPaletteCategory("WARGoetz")
            .setName("JSON Editor")
            .addPaletteEntry("", "JSON Editor", "An interactive JSON viewer and editor.", null, null)
            .setDefaultMetaName("jsonEditor")
            .setResources(Set.of(JS_RESOURCE)) 
            .setSchema(JsonSchema.parse(JsonEditorMeta.class.getResourceAsStream("/jsoneditor.props.json")))
            .setDefaultProps(createDefaultProps()) 
            .build();

    private static JsonObject createDefaultProps() {
        JsonObject props = new JsonObject();
        props.add("data", new JsonObject());
        props.addProperty("theme", "monokai");
        props.addProperty("editable", true);
        props.add("style", new JsonObject());

        // Initialize as empty object so 'theme' dropdown wins by default.
        // User adds properties here in the Designer to trigger the override.
        props.add("customTheme", new JsonObject());
        
        return props;
    }
}