const path = require('path');
const fs = require('fs');
const AfterBuildPlugin = require('@fiverr/afterbuild-webpack-plugin');

const LibName = "WARGoetzDesigner";

// ADDED: This function copies the built file to the Gateway's mounted folder
function copyToResources() {
    const generatedResourcesDir = path.resolve(__dirname, '../..', 'build/generated-resources/mounted/');
    const jsToCopy = path.resolve(__dirname, "dist/", `${LibName}.js`);
    const jSResourcePath = path.resolve(generatedResourcesDir, `${LibName}.js`);

    const toCopy = [{from:jsToCopy, to: jSResourcePath}];

    if (!fs.existsSync(generatedResourcesDir)){
        fs.mkdirSync(generatedResourcesDir, {recursive: true})
    }

    toCopy.forEach( file => {
        try {
            fs.access(file.from, fs.constants.R_OK, (err) => {
                if (!err) {
                    fs.createReadStream(file.from).pipe(fs.createWriteStream(file.to));
                }
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
    });
}

const config = {
    entry: {
        [LibName]: path.join(__dirname, "./typescript/perspective-designer.ts")
    },
    output: {
        library: [LibName],
        path: path.join(__dirname, "dist"),
        filename: "[name].js",
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    resolve: {
        extensions: [".jsx", ".js", ".ts", ".tsx", ".d.ts", ".css", ".scss"],
        modules: [
            "node_modules", 
            path.resolve(__dirname, "../../node_modules") 
        ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: { transpileOnly: true }
                },
                exclude: /node_modules/
            }
        ]
    },
    // ADDED: The plugin to trigger the copy function after building
    plugins: [
        new AfterBuildPlugin(function(stats) { copyToResources(); })
    ],
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "@inductiveautomation/perspective-client": "PerspectiveClient",
        "@inductiveautomation/perspective-designer": "PerspectiveDesigner",
        "@wargoetz/reactflow-client": "WARGoetzComponents" 
    }
};

module.exports = config;