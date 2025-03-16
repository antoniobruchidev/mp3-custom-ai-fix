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

// Check fo toasts
const toast = document.getElementById("toast")


/**
 * Method to show a toast
 * @param {string} t  the html of the toast to show
 */
const showToast = (t) => {
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(t)
    toastBootstrap.show()
}

// show toast
if (toast != null){
    showToast(toast)
}

let liveToasts = 0;

/**
 * Method to build and show the toast
 * @param {string} message the message to display in the toast 
 */
const createToast = (message) => {
    liveToasts++
    const t = document.createElement("div")
    t.setAttribute("id", `live-toast-${liveToasts}`)
    t.classList.add("toast")
    t.setAttribute("role", "alert")
    t.setAttribute("aria-live", "assertive")
    t.setAttribute("aria-atomic", "true")
    const tH = document.createElement("div")
    tH.classList.add("toast-header")
    const strong = document.createElement("strong")
    strong.classList.add("me-auto")
    strong.innerText = "The Custom Assistant"
    const button = document.createElement("button")
    button.classList.add("btn-close", "btn-close-white")
    button.setAttribute("aria-label", "Close")
    tH.appendChild(strong)
    tH.appendChild(button)
    t.appendChild(tH)
    const tB = document.createElement("div")
    tB.classList.add("toast-body")
    tB.innerText = message
    t.appendChild(tB)
    const toastContainer = document.getElementById("toast-container")
    toastContainer.appendChild(t)
    showToast(t)
    button.addEventListener("click", function() {
       $(`#live-toast-${liveToasts}`).hide()
    })
}

const main = $("main")
// check for errors
const error = document.getElementById("error")

// show error
if (error != null) {
    createToast(error.innerText)
}



