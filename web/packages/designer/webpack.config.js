const path = require('path');

const config = {
    entry: {
        DatabaseSchemaDesigner: path.join(__dirname, "./typescript/databaseschema-designer.ts")
    },
    output: {
        library: ["DatabaseSchemaDesigner"],
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
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "@inductiveautomation/perspective-client": "PerspectiveClient",
        "@inductiveautomation/perspective-designer": "PerspectiveDesigner",
        "@wargoetz/databaseschema-client": "DatabaseSchemaClient" 
    }
};

module.exports = config;