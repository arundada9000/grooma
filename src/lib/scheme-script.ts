/** Pre paint class toggle that syncs html.dark with stored or system scheme. */
export const SCHEME_SCRIPT = `(function(){try{var s=localStorage.getItem("grooma.scheme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;
