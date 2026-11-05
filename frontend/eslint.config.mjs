import stylistic from "@stylistic/eslint-plugin";

export default [
    {
        files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.ts"],
        plugins: {
            "@stylistic": stylistic
        },
        rules: {
            "@stylistic/brace-style": ["warn", "stroustrup"],
            "@stylistic/indent": ["warn", 4],
            "@stylistic/quotes": ["warn", "double"],
            "@stylistic/semi": ["warn", "always"]
        }
    }
];