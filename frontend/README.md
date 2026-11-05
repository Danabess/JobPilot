## LINK FOR ANY PROJECT

  1. Download this repository
  2. In your project run the command: `npm install --save-dev eslint "DOWNLOADED_REPOSITORY_PATH"`.
  3. Create a `eslint.config.mjs` file in your project folder.
  4. In file `eslint.config.mjs` add:
     ```JavaScript
       import config from "file:///DOWNLOADED_REPOSITORY_PATH/eslint.config.mjs"
     
       export default config;
     ```
