import org.gradle.language.jvm.tasks.ProcessResources

plugins {
    `java-library`
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

dependencies {
    // Reference the common project for shared Meta classes and Descriptors
    implementation(project(":common"))

    // Tells the module plugin that the web project output belongs in this scope
    modlImplementation(project(":web"))

    // Ignition SDK Dependencies (Fixed for Designer)
    compileOnly(libs.ignition.common)
    compileOnly(libs.ignition.designer.api) // The missing Designer API
    
    // Perspective Specific Dependencies (Fixed for Designer)
    compileOnly(libs.ignition.perspective.designer) // The missing Perspective Designer API
    implementation(libs.ignition.perspective.common)
    
    // Utilities
    compileOnly(libs.ia.gson)
}

tasks.named<ProcessResources>("processResources") {
    // 1. Make this task depend on the webpack task in the :web project
    val webpackTask = project(":web").tasks.named("webpack")
    dependsOn(webpackTask)

    // 2. Explicitly copy the compiled JS from the web client's distribution folder
    // This assumes your client package is at: web/packages/client/
    from(project(":web").file("packages/client/dist/DatabaseSchemaClient.js")) {
        // This folder MUST match your MODULE_ID in DatabaseSchemaMeta.java
        into("res/com.wargoetz.databaseschema")
    }
}
