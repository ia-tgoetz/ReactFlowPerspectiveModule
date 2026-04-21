package com.wargoetz.reactflow.designer;

import com.inductiveautomation.ignition.common.licensing.LicenseState;
import com.inductiveautomation.ignition.designer.model.AbstractDesignerModuleHook;
import com.inductiveautomation.ignition.designer.model.DesignerContext;
import com.inductiveautomation.perspective.designer.DesignerComponentRegistry;
import com.inductiveautomation.perspective.designer.api.PerspectiveDesignerInterface;
import com.wargoetz.reactflow.common.DatabaseSchemaMeta;
import com.wargoetz.reactflow.common.HierarchyChartMeta;
import com.wargoetz.reactflow.common.JsonEditorMeta; 
import com.wargoetz.reactflow.common.ArchitectureBuilderMeta; // <-- ADDED

public class DesignerHook extends AbstractDesignerModuleHook {

    private DesignerContext context;

    @Override
    public void startup(DesignerContext context, LicenseState activationState) throws Exception {
        this.context = context;
        PerspectiveDesignerInterface perspective = PerspectiveDesignerInterface.get(context);
        DesignerComponentRegistry registry = perspective.getDesignerComponentRegistry();

        registry.registerComponent(DatabaseSchemaMeta.DESCRIPTOR);
        registry.registerComponent(HierarchyChartMeta.DESCRIPTOR);
        registry.registerComponent(JsonEditorMeta.DESCRIPTOR); 
        registry.registerComponent(ArchitectureBuilderMeta.DESCRIPTOR); // <-- ADDED
    }

    @Override
    public void shutdown() {
        PerspectiveDesignerInterface perspective = PerspectiveDesignerInterface.get(context);
        perspective.getDesignerComponentRegistry().removeComponent(DatabaseSchemaMeta.COMPONENT_ID);
        perspective.getDesignerComponentRegistry().removeComponent(HierarchyChartMeta.COMPONENT_ID);
        perspective.getDesignerComponentRegistry().removeComponent(JsonEditorMeta.COMPONENT_ID); 
        perspective.getDesignerComponentRegistry().removeComponent(ArchitectureBuilderMeta.COMPONENT_ID); // <-- ADDED
    }
}