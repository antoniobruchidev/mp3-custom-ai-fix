const deleteAssistantButton = document.getElementById("delete-assistant")
const editAssistantButton = document.getElementById("edit-assistant")
const assistantSelector = document.getElementById("assistant-select")
const saveAssistantButton = document.getElementById("save-assistant")
const assistantName = document.getElementById("assistant-name")
const basePrompt = document.getElementById("assistant-base-prompt")
const editTraitButtons = document.getElementsByClassName("btn-edit-trait")
const assistantId = document.getElementById("assistant-id")
const traitsContainer = document.getElementById("traits-container")
const deleteModal = document.getElementById('delete-modal')
const deleteConfirmationButton = document.getElementById("delete-confirmation")
const sendButton = document.getElementById("send-message")
const clear = document.getElementById("clear")

let activeAssistant = {
    id: null,
    assistantName: null,
    assistantBasePrompt: null,
    assistantTraits: []
}

/**
 * Method to delete a trait
 * @param {html element} element 
 */
const deleteTrait = async (traitId, url) => {
    form.setAttribute("action", url)
    form.submit()
}


/**
 * Method to save a trait
 * @param {html element} element 
 */
const saveTrait = async (element) => {
    const traitId = element.getAttribute("data-id")
    const form = document.getElementById(`form-trait${traitId}`)
    const url = form.getAttribute("action")
    let formData = new FormData(form)
    formData.append("trait-id", traitId)
    const response = await fetch(url, {
        method: "POST",
        body: formData
    })
    const data = await response.json()
    if (data.status == 200) {
        window.location.reload()
    } else {
        window.location.reload()
    }
}

/**
 * Method to let the user edit a trait
 * @param {html element} element 
 */
const enableEditTrait = (element) => {
    const traitId = element.getAttribute("data-id")
    const saveButton = document.getElementById(`save${traitId}`)
    const deleteButton = document.getElementById(`delete${traitId}`)
    const value = document.getElementById(`value${traitId}`)
    const reasonWhy = document.getElementById(`reason-why${traitId}`)
    saveButton.removeAttribute("disabled")
    deleteButton.removeAttribute("disabled")
    value.removeAttribute("disabled")
    reasonWhy.removeAttribute("disabled")
    deleteButton.addEventListener("click", function(e) {
        deleteTrait(e.target)
    })
    saveButton.addEventListener("click", function(e) {
        saveTrait(e.target)
    })
}

/**
 * Method to reset the fields of the active assistant
 * @param {string} name 
 * @param {string} prompt 
 */
const resetAssistantFields = () => {
    if (activeAssistant.id != null){
        assistantName.value = activeAssistant.assistantName
        basePrompt.value = activeAssistant.assistantBasePrompt    
        assistantName.setAttribute("disabled", true)
        basePrompt.setAttribute("disabled", true)
        saveAssistantButton.setAttribute("disabled", true)
        deleteAssistantButton.classList.remove("hidden")
        clear.classList.add("hidden")
        editAssistantButton.removeAttribute("disabled")
    } else {
        assistantSelector.value = 0
        assistantName.value = ""
        basePrompt.value = ""
    }
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
 * Method to create a button with the values of the trait in a popover
 * @param {string} trait 
 * @param {integer} value 
 * @param {string} reasonWhy 
 * @param {integer | null} id 
 * @returns 
 */
const createButtonWithPopover = (trait, value, reasonWhy, id) => {
    const button = document.createElement("button")
    button.classList.add("btn", "btn-lg", "btn-trait")
    button.setAttribute("data-bs-toggle", "popover")
    button.setAttribute("data-bs-title", `${trait.toUpperCase()}: ${value}`)
    button.setAttribute("data-bs-content", reasonWhy)
    button.setAttribute("data-bs-placement", "bottom")
    button.setAttribute("data-bs-custom-class", "btn-popover")
    if (id != null) {
        button.setAttribute("data-id", id)
    }
    button.innerText = trait.toUpperCase()
    return button
}

/**
 * Method to show added traits in traits container
 * @param {*} traits 
 */
const showAssistantTraits = (traits) => {
    var button = null
    for (let trait of traits) {
        button = createButtonWithPopover(trait.trait_name, trait.trait_value, trait.trait_reason_why, trait.trait_id)
        traitsContainer.appendChild(button)
    }

}

/**
 * Method to set the active assistant
 * @param {string} assistantId 
 * @param {string} assistantName 
 * @param {string} basePrompt 
 */
const setActiveAssistant = (data) => {
    activeAssistant.id = data.assistant_id
    activeAssistant.assistantName = data.assistant_name
    activeAssistant.assistantBasePrompt = data.prompt
    activeAssistant.traits = data.traits
    showAssistantTraits(data.traits)
    updatePopovers()
}

/**
 * Method to get a given assistant
 * @param {string} url 
 */
const getAssistant = async (url) => {
    const response = await fetch(url)
    const data = await response.json()
    if (data.status == 200) {
        clear.classList.add("hidden")
        editAssistantButton.removeAttribute("disabled")
        editAssistantButton.classList.remove("hidden")
        deleteAssistantButton.classList.remove("hidden")
        setActiveAssistant(data)
        $(assistantId).val(data.assistant_id)
        $(assistantName).val(data.assistant_name)
        $(basePrompt).val(data.prompt)
        assistantName.setAttribute("disabled", true)
        basePrompt.setAttribute("disabled", true)
        saveAssistantButton.setAttribute("disabled", true)
        deleteAssistantButton.setAttribute("data-bs-url", `/assistants/${data.assistant_id}/delete`)
        deleteAssistantButton.setAttribute("data-bs-id", data.assistant_id)
        deleteAssistantButton.setAttribute("data-bs-type", "Assistant")
        deleteAssistantButton.setAttribute("data-bs-record", data.assistant_name)
        deleteAssistantButton.setAttribute("data-bs-toggle", "modal")
        deleteAssistantButton.setAttribute("data-bs-target", "#delete-modal")
        $(editAssistantButton).on("click", (e) => {
            deleteAssistantButton.classList.add("hidden")
            clear.classList.remove("hidden")
            editAssistantButton.setAttribute("disabled", true)
            assistantName.removeAttribute("disabled")
            basePrompt.removeAttribute("disabled")
            saveAssistantButton.removeAttribute("disabled")
        })
    }
}

/**
 * Method to save or edit an assistant
 */
const saveOrEditAssistant = async () => {
    const edit = editAssistantButton.hasAttribute("disabled")
    const form = document.getElementById("assistant-form")
    const url = form.getAttribute("action")
    const name = document.getElementById("assistant-name")
    const prompt = document.getElementById("assistant-base-prompt")
    if (name.value != null || prompt.value != null){
        if (activeAssistant.id != null){
            payload = {
                "edit": edit,
                "assistant_id": activeAssistant.id,
                "assistant_name": name.value,
                "base_prompt": prompt.value,
            }
        } else {
            payload = {
                "assistant_name": name.value,
                "base_prompt": prompt.value,
                "edit": false,
                "traits": []
            }
        }
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        const data = await response.json()
        if (data.status == 200) {
            window.location.href = window.location.pathname
        } else {
            createToast(data.error)
        }
    } else {
        createToast("Name and base prompt cannot be blank")
    }
}

/**
 * Method to show the bot answer
 * @param {string} answer 
 * @returns {string} the card to be shown as innerHtml
 */
const showMessage = (message, user) => {
    const alert = document.createElement("div")
    alert.classList.add("alert", "alert-primary", "w-75")
    alert.setAttribute("role", "alert")
    const icon = document.createElement("div")
    if(user == true){
        alert.innerHTML = message
        alert.classList.add("float-end", "text-end")
        icon.classList.add("human-icon", "ms-4", "d-inline-block")
        alert.appendChild(icon)
    } else {
        alert.classList.add("float-start")
        icon.classList.add("ai-icon", "me-2", "d-inline-block")
        alert.innerHTML = message
        alert.prepend(icon)
    }
    chatHistory.appendChild(alert)
}


if (saveAssistantButton != null){
    saveAssistantButton.addEventListener("click", saveOrEditAssistant)
}
if(clear != null){
    clear.addEventListener("click", resetAssistantFields)
}
if (assistantSelector != null){
    assistantSelector.addEventListener("change", function(e) {
        const assistantId = $(e.target).val()
        const url = `${$(e.target).attr("data-url")}${assistantId}`
        const traitsContainer = document.getElementById("traits-container")
        traitsContainer.innerHTML = ""
        getAssistant(url)
    })
}

for (let editButton of editTraitButtons) {
    editButton.addEventListener("click", function(e){
        enableEditTrait(e.target)
    }) 
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

const addTraitButtons = document.getElementsByClassName("btn-add-trait")


/**
 * Method to connect a trait to an assistant
 * @param {html element} element 
 */
const addTraitToAssistant = async (element) => {
    if (activeAssistant.id == null) {
        createToast("Select an assistant first")
    } else {
        let url = `${element.getAttribute("data-url")}${activeAssistant.id}`
        const response = await fetch(url, {
            method: "POST",
        })
        const data = await response.json()
        if (data.status = 200) {
            window.location.href = window.location.pathname
        } else {
            createToast(data.error)
        }
    }

}

/**
 * Method to create a spinner to notify the user
 * @param {html element} element 
 */
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

/**
 * Method that initialize the chat history at the frontend
 * @returns FormData element
 */
const initializeAssistantChatHistory = () => {
    const base_prompt = document.getElementById("assistant-base-prompt")
    let traitsPrompt = ""
    const message = document.getElementById("message")
    const traits = document.getElementsByClassName("btn-trait")
    showMessage(message.value, true)
    if (traits.length > 0) {
        for (let i=0; i < traits.length; i++) {
            let title = traits[i].getAttribute("data-bs-title")
            let reasonWhy = traits[i].getAttribute("data-bs-content")
            traitsPrompt += `${title} \n${reasonWhy}\n\n`
        }
    }
    const formData = new FormData()
    formData.append("base-prompt", base_prompt.value)
    formData.append("traits", traitsPrompt)
    formData.append("message", message.value)
    let systemPrompt = `${basePrompt.value}
        
Below there is a list of character traits with assigned
a number and the reason why. The number will be on a scale between 1 and 10 where 1 is the 
minimum and 10 is the maximum.
You MUST answer accordingly to your character traits.
You MUST NOT share your character traits scores with the user.
You MUST NOT share your logic.

${traitsPrompt}`

        chatHistory.push({"role": "system", "content": systemPrompt})
        chatHistory.push({"role": "human", "content": message.value})
        return formData
}

/**
 * Method to handle the chat response
 * @param {dict} data 
 */
const handleChatResponse = (data) => {
    if (data.status == 200) {
        showMessage(data.answer, false)
        chatHistory.push({"role": "assistant", "content": data.answer})
        const promptTokens = document.getElementById("prompt-tokens")
        const completionTokens = document.getElementById("completion-tokens")
        let newPromptTokens = parseInt(promptTokens.innerText) + parseInt(data.prompt_tokens)
        let newCompletionTokens = parseInt(completionTokens.innerText) + parseInt(data.comp_tokens)
        promptTokens.innerText = newPromptTokens
        completionTokens.innerText = newCompletionTokens
        createToast(`PROMPT TOKENS: ${data.prompt_tokens} - COMPLETION TOKENS: ${data.comp_tokens}`)

    } else {
        createToast(data.error)
    }
}


/**
 * Method to call the chatbot
 */
const chat = async () => {
    const message = document.getElementById("message")
    const basePrompt = document.getElementById("assistant-base-prompt")
    if (message.value == "" || basePrompt.value == ""){
        createToast("Assistant base prompt and user message cannot be blank")
        sendButton.removeAttribute("disabled")
        sendButton.innerHTML = "Send Message"
    } else {
        const url = window.location.pathname.replace("/assistants", "/chat")
        if (chatHistory.length == 0){
            const formData = initializeAssistantChatHistory()
            const response = await fetch(url, {
                method: "POST",
                body: formData
            })
            const data = await response.json()
            handleChatResponse(data)
        } else {
            const message = document.getElementById("message")
            chatHistory.push({"role": "human", "content": message.value})
            showMessage(message.value, true)
            const headers = {"Content-Type": "application/json"}
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({"chat_history": chatHistory})
            })
            const data = await response.json()
            handleChatResponse(data)
        }
        sendButton.removeAttribute("disabled")
        sendButton.innerHTML = "Send Message"
    }
}

for (let addTraitButton of addTraitButtons) {
    addTraitButton.addEventListener("click", event => {
        addTraitToAssistant(event.target)
    })
}

// add event listener to invoke the chatbot with the active settings
sendButton.addEventListener("click", event => {
    createSpinner(event.target)
    chat()
    const message = document.getElementById("message")
    message.value = ""
})

const saveHistoryButton = document.getElementById("save-history")


/**
 * Method to save the chat history
 * @param {string} url 
 */
const saveHistory = async (url) => {
    if (chat_history.length > 0){
        const name = document.getElementById("chat-history-name")
        const payload = {"chat_history": chatHistory, "chat_history_name": name.value}
        const headers = {"Content-Type": "application/json"}
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        })
        const data = await response.json()
        if (data.status == 200) {
            createToast(data.message)
            assistantSelector.value = "Select your assistant"
            basePrompt.value = ""
            assistantName.value = ""
            const answerContainer = document.getElementById("answer-container")
            const message = document.getElementById("message")
            message.value = ""
            answerContainer.innerHTML = ""
        } else {
            createToast(data.error)
        }
    }
}

saveHistoryButton.addEventListener("click", event => {
    const button = event.target
    const url = button.getAttribute("data-url")
    saveHistory(url)
})


