const deleteCollectionButton = document.getElementById("delete-collection")
const editCollectionButton = document.getElementById("edit-collection")
const collectionSelector = document.getElementById("collection-select")
const saveCollectionButton = document.getElementById("save-collection")
const collectionName = document.getElementById("collection-name")
const description = document.getElementById("collection-description")
const collectionId = document.getElementById("collection-id")
const clear = document.getElementById("clear")
const addNewSourceButton = document.getElementById("upload-source")
const addToButtons = document.getElementsByClassName("btn-add-to")
const deleteModal = document.getElementById('delete-modal')
const deleteConfirmationButton = document.getElementById("delete-confirmation")
const sourcesContainer = document.getElementById("sources-container")

const sendButton = document.getElementById("send-message")

let activeCollection = {
    id: null,
    collectionName: null,
    description: null,
    sources: []
}

/**
 * Method to enable the popovers present
 */
const updatePopovers = () => {
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
    return popoverList
}

/**
 * Method to create a button with the description of the source in a popover
 * @param {string} trait 
 * @param {integer} value 
 * @param {string} reasonWhy 
 * @param {integer | null} id 
 * @returns 
 */
const createButtonWithPopover = (name, description, id) => {
    const button = document.createElement("button")
    button.classList.add("btn", "btn-lg", "btn-source")
    button.setAttribute("data-bs-toggle", "popover")
    button.setAttribute("data-bs-title", name)
    button.setAttribute("data-bs-content", description)
    button.setAttribute("data-bs-placement", "bottom")
    button.setAttribute("data-bs-custom-class", "btn-popover")
    if (id != null) {
        button.setAttribute("data-id", id)
    }
    button.innerText = name.toUpperCase()
    return button
}

/**
 * Method to show the ingested sources for the active collection
 * @param {*} sources 
 */
const showIngestedSources = (sources) => {
    var button = null
    for (let source of sources) {
        button = createButtonWithPopover(source.name, source.description)
        sourcesContainer.appendChild(button)
    }

}


const addNewSource = () => {
    const form = document.getElementById("source-form")
    const formData = new FormData(form)
    const name = formData.get("source-name")
    let error = null
    if (name.length > 16) {
        error = `Name field must be 16 character or less. Characters: ${name.length}`
    } else if (name == "") {
        error = "Name field cannot be empty"
    }
    const description = formData.get("description")
    if (description.length > 255) {
        error = `Description field must be 255 character or less. Characters: ${description.length}`
    }
    if (error != null) {
        createToast(error)
    } else {
        const url = window.location.pathname.replace("/collections", "sources/create")
        postData(url, formData)
    }
}

const addToCollection = (element) => {
    const collection = document.getElementById("collection-select")
    if (collection.value == "Select you collection") {
        createToast("Select a collection before adding a source")
    } else {
        const url = window.location.pathname.replace("/collections", "/add_source_to_collection")
        let formData = new FormData()
        formData.append("source-id", element.getAttribute("data-id"))
        formData.append("collection-id", collection.value)
        postData(url, formData)
    }
}
/**
 * Method to show the bot answer
 * @param {string} answer 
 * @returns {string} the card to be shown as innerHtml
 */
const showAnswer = (answer) => {
    const alert = document.createElement("div")
    alert.classList.add("alert", "alert-light", "d-flex", "align-items-center")
    alert.setAttribute("role", "alert")
    alert.innerHTML = `Assistant: ${answer}`
    const chatHistory = document.getElementById("answer-container")
    chatHistory.appendChild(alert)
}


/**
 * Method to call the chatbot
 */
const chat = async () => {
    const question = document.getElementById("question")
    const collection = document.getElementById("collection-select")
    console.log(collection.value)
    const url = window.location.pathname.replace("/collections", "/chat")
    const formData = new FormData()
    formData.append("collection-id", collection.value)
    formData.append("question", question.value)
    const response = await fetch(url,{
        method: "POST",
        body: formData
    })
    const data = await response.json()
    if (data.status == 200) {
        sendButton.removeAttribute("disabled")
        sendButton.innerHTML = "Send message"
        showAnswer(data.answer.message)
    } else {
        createToast(data.answer.error)
    }
}


const resetCollectionFields = () => {
    if (activeCollection.id != null){
        collectionName.value = activeCollection.collectionName
        description.value = activeCollection.description
        collectionId.value =  activeCollection.id
        collectionName.setAttribute("disabled", true)
        description.setAttribute("disabled", true)
        saveCollectionButton.setAttribute("disabled", true)
        deleteCollectionButton.classList.remove("hidden")
        clear.classList.add("hidden")
        editCollectionButton.removeAttribute("disabled")
    }
}

const setActiveCollection = (data) => {
    activeCollection.id = data.collection_id
    activeCollection.collectionName = data.collection_name
    activeCollection.description = data.description
    activeCollection.sources = data.sources
    showIngestedSources(data.sources)
    updatePopovers()
}

const getCollection = async (url) => {
    const response = await fetch(url)
    const data = await response.json()
    console.log(data)
    if (data.status == 200) {
        clear.classList.add("hidden")
        editCollectionButton.classList.remove("hidden")
        deleteCollectionButton.classList.remove("hidden")
        setActiveCollection(data)
        $(collectionId).val(data.collection_id)
        $(collectionName).val(data.collection_name)
        $(description).val(data.description)
        collectionName.setAttribute("disabled", true)
        description.setAttribute("disabled", true)
        saveCollectionButton.setAttribute("disabled", true)
        deleteCollectionButton.setAttribute("data-bs-url", `/collections/${data.collection_id}/delete`)
        deleteCollectionButton.setAttribute("data-bs-id", data.collection_id)
        deleteCollectionButton.setAttribute("data-bs-type", "Collection")
        deleteCollectionButton.setAttribute("data-bs-record", data.collection_name)
        deleteCollectionButton.setAttribute("data-bs-toggle", "modal")
        deleteCollectionButton.setAttribute("data-bs-target", "#delete-modal")
        $(editCollectionButton).on("click", (e) => {
            deleteCollectionButton.classList.add("hidden")
            clear.classList.remove("hidden")
            editCollectionButton.setAttribute("disabled", true)
            collectionName.removeAttribute("disabled")
            description.removeAttribute("disabled")
            saveCollectionButton.removeAttribute("disabled")
        })
    }
}

clear.addEventListener("click", resetCollectionFields)

collectionSelector.addEventListener("change", function(e) {
    const collectionId = $(e.target).val()
    const url = `${$(e.target).attr("data-url")}${collectionId}`
    console.log(url)
    getCollection(url)
})

const createSpinner = (element) => {
    const spinnerSpan = document.createElement("span")
    const spinnerRole = document.createElement("span")
    spinnerSpan.classList.add("spinner-border", "spinner-border-sm")
    spinnerSpan.setAttribute("aria-hidden", "true")
    spinnerRole.setAttribute("role", "status")
    spinnerRole.innerText = "Loading..."
    element.innerHTML = ""
    element.appendChild(spinnerSpan)
    element.appendChild(spinnerRole)
    element.setAttribute("disabled", "true")
}

sendButton.addEventListener("click", event => {
    createSpinner(event.target)
    chat()
})

addNewSourceButton.addEventListener("click", addNewSource)


for (let button of addToButtons) {
    if (button.getAttribute("data-id") != null) {
        button.addEventListener("click", function(e) {
            addToCollection(e.target)
        })
    }
}


if (deleteModal) {
    deleteModal.addEventListener('show.bs.modal', event => {
        // Button that triggered the modal
        const button = event.relatedTarget
        // Extract info from data-bs-* attributes
        const url = button.getAttribute('data-bs-url')
        const type = button.getAttribute('data-bs-type')
        const record = button.getAttribute('data-bs-record')
        // Update the modal's content.
        const typeSpan = document.getElementById('type')
        typeSpan.innerText = type
        const recordSpan = document.getElementById('record')
        recordSpan.innerText = record
        // Update form action
        deleteConfirmationButton.setAttribute('data-bs-url', url)
    })
    deleteConfirmationButton.addEventListener("click", event => {
        const close = document.getElementById("modal-close")
        close.addEventListener("click", e => {
            event.target.removeEventListener("click")
        })
        const form = document.createElement("form")
        const button = event.target
        const url = button.getAttribute("data-bs-url")
        const deleteButton = document.createElement("button")
        deleteButton.setAttribute("type", "submit")
        const body = document.getElementsByTagName("body")[0]
        form.setAttribute("action", url)
        form.setAttribute("method", "POST")
        form.appendChild(deleteButton)
        body.appendChild(form)
        deleteButton.click()
    })
}
