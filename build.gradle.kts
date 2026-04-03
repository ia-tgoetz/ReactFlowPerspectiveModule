import java.util.concurrent.TimeUnit

plugins {
    base
    // the ignition module plugin: https://github.com/inductiveautomation/ignition-module-tools
    id("io.ia.sdk.modl") version("0.1.1")
    id("org.barfuin.gradle.taskinfo") version "2.1.0"
}

allprojects {
    version = "1.0.0"
    group = "com.wargoetz.schema" // <-- Updated Group
}

ignitionModule {
    // name of the .modl file to build
    fileName.set("DatabaseSchema") // <-- Updated filename

    // module xml configuration
    name.set("Database Schema Component") // <-- Updated display name
    id.set("com.wargoetz.databaseschema") // <-- Updated module ID
    moduleVersion.set("${project.version}")
    moduleDescription.set("A Perspective component for visualizing SQL Historian database schemas.") // <-- Updated description
    requiredIgnitionVersion.set("8.3.0")
    license.set("license.html")

    // If we depend on other module being loaded/available, then we specify IDs of the module we depend on,
    // and specify the Ignition Scope that applies. "G" for gateway, "D" for designer, "C" for VISION client
    // (this module does not run in the scope of a Vision client, so we don't need a "C" entry here)
    moduleDependencies.put("com.inductiveautomation.perspective", "DG")

    // map of 'Gradle Project Path' to Ignition Scope in which the project is relevant.  This is is combined with
    // the dependency declarations within the subproject's build.gradle.kts in order to determine which
    // dependencies need to be bundled with the module and added to the module.xml.
    projectScopes.putAll(
        mapOf(
            ":gateway" to "G",
            ":web" to "GD",      // <--- Change "G" to "GD"
            ":designer" to "D",
            ":common" to "GD"
        )
    )

    // 'hook classes' are the things that Ignition loads and runs when your module is installed.  This map tells
    // Ignition which classes should be loaded in a given scope.
    hooks.putAll(
        mapOf(
            "com.wargoetz.schema.gateway.GatewayHook" to "G", // <-- Updated Gateway Hook path
            "com.wargoetz.schema.designer.DesignerHook" to "D"  // <-- Updated Designer Hook path
        )
    )
    skipModlSigning.set(true)
}

val deepClean by tasks.registering {
    dependsOn(allprojects.map { "${it.path}:clean" })
    description = "Executes clean tasks and remove node plugin caches."
    doLast {
        delete(file(".gradle"))
    }
}
