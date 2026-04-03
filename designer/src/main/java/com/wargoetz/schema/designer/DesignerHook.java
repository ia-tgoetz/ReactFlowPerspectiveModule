package com.wargoetz.schema.designer;

import com.inductiveautomation.ignition.common.licensing.LicenseState;
import com.inductiveautomation.ignition.designer.model.AbstractDesignerModuleHook;
import com.inductiveautomation.ignition.designer.model.DesignerContext;
import com.inductiveautomation.perspective.designer.DesignerComponentRegistry;
import com.inductiveautomation.perspective.designer.api.PerspectiveDesignerInterface;
import com.wargoetz.schema.common.DatabaseSchemaMeta;

public class DesignerHook extends AbstractDesignerModuleHook {
    
    private DesignerContext context;

    @Override
    public void startup(DesignerContext context, LicenseState activationState) throws Exception {
        this.context = context;
        PerspectiveDesignerInterface perspective = PerspectiveDesignerInterface.get(context);
        DesignerComponentRegistry registry = perspective.getDesignerComponentRegistry();
        
        registry.registerComponent(DatabaseSchemaMeta.DESCRIPTOR);
    }

    @Override
    public void shutdown() {
        PerspectiveDesignerInterface perspective = PerspectiveDesignerInterface.get(context);
        perspective.getDesignerComponentRegistry().removeComponent(DatabaseSchemaMeta.COMPONENT_ID);
    }
}