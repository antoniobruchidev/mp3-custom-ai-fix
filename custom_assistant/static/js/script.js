/**
 * Method to change the active page on the navbar
 */
const setNavbarActivePage = () => {
    let homeButton = document.getElementById("home")
    let playgroundButton = document.getElementById("playground")
    let collectionsButton = document.getElementById("collections")
    let activeUrl = window.location.href
    if ("" != activeUrl.split("/")[3]){
        homeButton.removeAttribute("aria-current")
        homeButton.classList.remove("active")
        if (activeUrl.split("/")[3] == "playground"){
            playgroundButton.classList.add("active")
            playgroundButton.setAttribute("aria-current", "page")
        } else if (activeUrl.split("/")[3] == "collections") {
            collectionsButton.classList.add("active")
            collectionsButton.setAttribute("aria-current", "page")
        }
    }

}

setNavbarActivePage()