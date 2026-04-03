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
    // we have a dependency on the common project.  Use the typesafe syntax here, but could also be written
    // as 'api(project(":common"))'. See https://docs.gradle.org/7.0/release-notes.html on Type-safe project accessors
    implementation(projects.common)

    modlImplementation(projects.web)

    // declare our dependencies on ignition sdk elements.  These are defined in the gradle/libs.versions.toml file of
    // the root project for this module
    compileOnly(libs.ignition.common)
    compileOnly(libs.ignition.gateway.api)
    implementation(libs.ignition.perspective.gateway)
    implementation(libs.ignition.perspective.common)
    compileOnly(libs.ia.gson)
}

tasks.named<ProcessResources>("processResources") {
    val webpackTask = project(":web").tasks.named("webpack")
    dependsOn(webpackTask)

    // THE FIX: Explicitly grab the compiled JS file from the web project's dist folder
    from(project(":web").file("packages/client/dist/DatabaseSchemaClient.js")) {
        // This folder MUST match the ID in your DatabaseSchemaMeta.java
        into("res/com.wargoetz.databaseschema")
    }
}