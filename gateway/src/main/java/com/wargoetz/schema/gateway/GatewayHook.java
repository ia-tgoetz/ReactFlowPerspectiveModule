package com.wargoetz.schema.gateway;

import com.inductiveautomation.ignition.common.licensing.LicenseState;
import com.inductiveautomation.ignition.gateway.model.AbstractGatewayModuleHook;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import com.inductiveautomation.perspective.gateway.api.PerspectiveContext;
import com.wargoetz.schema.common.DatabaseSchemaMeta;

public class GatewayHook extends AbstractGatewayModuleHook {
    private GatewayContext gatewayContext;

    @Override
    public void setup(GatewayContext gatewayContext) {
        this.gatewayContext = gatewayContext;
    }

    @Override
    public void startup(LicenseState activationState) {
        PerspectiveContext perspectiveContext = PerspectiveContext.get(this.gatewayContext);
        perspectiveContext.getComponentRegistry().registerComponent(DatabaseSchemaMeta.DESCRIPTOR);
    }

    @Override
    public void shutdown() {
        PerspectiveContext perspectiveContext = PerspectiveContext.get(this.gatewayContext);
        perspectiveContext.getComponentRegistry().removeComponent(DatabaseSchemaMeta.COMPONENT_ID);
    }
}