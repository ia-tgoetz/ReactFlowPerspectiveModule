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
    implementation(projects.common)
    // modlImplementation(projects.web)

    compileOnly(libs.ignition.common)
    compileOnly(libs.ignition.designer.api)
    
    compileOnly(libs.ignition.perspective.designer)
    implementation(libs.ignition.perspective.common)
    
    compileOnly(libs.ia.gson)
}

tasks.named<ProcessResources>("processResources") {
    val webpackTask = project(":web").tasks.named("webpack")
    dependsOn(webpackTask)

    // THE REAL FIX: Copy the file directly into the "mounted" folder
    from(project(":web").file("packages/client/dist/DatabaseSchemaClient.js")) {
        into("mounted")
    }
}