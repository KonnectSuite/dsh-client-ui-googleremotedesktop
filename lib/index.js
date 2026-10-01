//#region src/index.ts
/**
* Google Remote Desktop, host half.
*
* The page is pure presentation on a published client surface, so the node half
* has nothing to register: no tool, no route, no Session event, no prompt
* section. It exists because a bundle row must resolve a package root, and its
* `dsh.client` declaration is what puts the browser half in the page.
*/
function apply() {}
//#endregion
export { apply };
