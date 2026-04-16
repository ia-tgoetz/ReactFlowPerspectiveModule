package com.wargoetz.reactflow.gateway;

import java.util.Optional;

import com.inductiveautomation.ignition.common.licensing.LicenseState;
import com.inductiveautomation.ignition.gateway.model.AbstractGatewayModuleHook;
import com.inductiveautomation.ignition.gateway.model.GatewayContext;
import com.inductiveautomation.perspective.gateway.api.PerspectiveContext;
import com.wargoetz.reactflow.common.DatabaseSchemaMeta;
import com.wargoetz.reactflow.common.HierarchyChartMeta;

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
        perspectiveContext.getComponentRegistry().registerComponent(HierarchyChartMeta.DESCRIPTOR);
    }

    @Override
    public void shutdown() {
        PerspectiveContext perspectiveContext = PerspectiveContext.get(this.gatewayContext);
        perspectiveContext.getComponentRegistry().removeComponent(DatabaseSchemaMeta.COMPONENT_ID);
        perspectiveContext.getComponentRegistry().removeComponent(HierarchyChartMeta.COMPONENT_ID);
    }

    @Override
    public Optional<String> getMountedResourceFolder() {
        return Optional.of("mounted");
    }
}