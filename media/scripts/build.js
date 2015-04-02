({
    mainConfigFile: "common.js",

    baseUrl : ".",
    findNestedDependencies: true, // find runtime dependencies
    removeCombined: true,
    // fileExclusionRegExp: /^dist$/,
    // generateSourceMaps: true,
    dir: "dist",

    modules: [
        {
            name: "myhome",
            exclude: [
                "infrastructure"
            ]
        },

        {
            name: "group",
            exclude: [
                "infrastructure"
            ]
        },

        {
            name: "organization",
            exclude: [
                "infrastructure"
            ]
        },
        
        {
            name: "infrastructure"
        }
    ]
})
