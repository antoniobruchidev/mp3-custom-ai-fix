// get elements for the event listeners
const setTraitButton = document.getElementById("save-trait")

const value = document.getElementById("value")
const valueLabel = document.getElementById("value-label")
value.value = 5
valueLabel.innerText = `Value: ${value.value}`

const clearTraitsButton = document.getElementById("clear")
const saveAssistantButton = document.getElementById("save-assistant")

var modalEl = document.getElementById('add-trait-modal')

const traits = document.getElementsByClassName("custom-tooltip")

const sendButton = document.getElementById("send-message")

/**
 * Method to enable the popovers present
 */
const updatePopovers = () => {
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
    return popoverList
}

/**
 * Method to add a new trait button and close the modal
 */
const appendTraitAndCloseModal = () => {
    updatePopovers()
    const closeTraitButton = document.getElementById("close-trait")
    closeTraitButton.click()
}

/**
 * Method to save a character trait from the given inputs
 */
const setTrait = () => {
    const trait = document.getElementById("trait")
    const value = document.getElementById("value")
    const reasonWhy = document.getElementById("reason-why")
    const existingTraits = document.getElementById("traits-container-modal").children
    for (let existingTrait of existingTraits) {
        if (!existingTrait.innerText.includes("Your existing traits -")){
            var traitTitle = existingTrait.innerText
            var cleanedTrait = traitTitle.split(":")[0]
            var cleanedValue = traitTitle.split(":")[1].trim("\n").replace(" ", "")
            var title = `${cleanedTrait.toUpperCase()}: ${cleanedValue}`
            var traitTitle = `${trait.value.toUpperCase()}: ${value.value}`
            var spaces = null
            for (let char of title) {
                if (char == " ") {
                    spaces++
                }
            }
            if (title == traitTitle) {
                createToast("You cannot have 2 traits with the same name and the same value")
                break
            } else if (spaces != null && spaces > 1) {
                createToast("Trait name must be one word only")
                break
            }
        }
    }
    const button = createButtonWithPopover(trait.value, value.value, reasonWhy.value, null)
    trait.value = ""
    value.value = 5
    reasonWhy.value = ""
    const traitsContainer = document.getElementById("traits-container")
    traitsContainer.appendChild(button)
    appendTraitAndCloseModal()
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
 * Method to clear the traits
 */
const clearTraits = () => {
    const traitsContainer = document.getElementById("traits-container")
    traitsContainer.innerHTML = ""
}

/**
 * Method to save the traits one by one
 * @returns dictionary with the traits
 */
const saveTraits = () => {
    popoverList = updatePopovers()
    let traits = []
    for (let popover of popoverList) {
        let title = $(popover._element).attr("data-bs-title")
        let trait = title.split(":")[0]
        let value = title.split(":")[1]
        let reasonWhy = $(popover._element).attr("data-bs-content")
        traits.push({
            "trait": trait, 
            "value": value,
            "reason_why": reasonWhy
        })
    }
    return traits
}

/**
 * Method to save the customized assistant
 */
const saveAssistant = async () => {
    let url = window.location.pathname.replace("/playground", "/assistants/create");
    const name = document.getElementById("assistant-name")
    const basePrompt = document.getElementById("base-prompt")
    if (name.value == "" || basePrompt.value == "") {
        createToast("Assistant name and prompt cannot be blank")
    } else {
        const characterTraits = saveTraits()
        let payload = {
            "assistant_name": name.value,
            "base_prompt": basePrompt.value,
            "traits": characterTraits,
            "edit": false
            };
        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload),
        })
        const data = await response.json()
        if (data.status == 200) {
            window.location.reload()
        } else {
            createToast(data.error)
        }
    }
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
 * Method to make a trait active in the playground and close the traits modal
 * @param {element} trait  the element representing the trait to be added
 */
const finalizeModalClose = (trait) => {
    var name = $(trait).text().split(":")[0].trim()
    var value = $(trait).text().split(":")[1]
    var reasonWhy = $(trait).attr("data-bs-title")
    var id = $(trait).attr("id")
    var button = createButtonWithPopover(name, value, reasonWhy, id)
    const traitsContainer = document.getElementById("traits-container")
    traitsContainer.appendChild(button)
    updateTooltips()
    const valueReset = document.getElementById("value")
    const valueLabel = document.getElementById("value-label")
    valueReset.value = 5
    valueLabel.innerText = "Value: 5"
    appendTraitAndCloseModal()
}

/**
 * Method to change the trait value label according its value
 */
const changeValueLabel = () => {
    const valueLabel = document.getElementById("value-label")
    const value = document.getElementById("value")
    valueLabel.innerText = `Value: ${value.value}`
}

// add event listener for value change
value.addEventListener("change", function (e) {
    changeValueLabel()
})

// add event listener to set the trait
setTraitButton.addEventListener("click", setTrait)

// add event listener to each saved trait present the modal
for (let trait of traits) {
    trait.addEventListener("dblclick", function (e) {
        finalizeModalClose(trait)
    })
}

// add event listener to invoke the chatbot with the active settings
sendButton.addEventListener("click", event => {
    const button = event.target
    button.setAttribute("disabled", "true")
    const formData = preparePrompts()
    createSpinner(event.target)
    sendChatForm(formData, event.target)
})

// add event listener to clear the traits
clearTraitsButton.addEventListener("click", clearTraits)

// add event listener to save the assistant if the user is logged in
if (saveAssistantButton != null) {
    saveAssistantButton.addEventListener("click", saveAssistant)
}

/**
 * Method to create a spinner and notify the user
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

const sendChatForm = async (formData, element) => {
    const url = window.location.pathname.replace("/playground", "/chat")
    const response = await fetch(url, {
        method: "POST",
        body: formData
    })
    const data = await response.json()
    if (data.status == 200) {
        showAnswer(data.answer)
        element.removeAttribute("disabled")
        element.innerHTML = "Send message"
        const promptTokens = document.getElementById("prompt-tokens")
        const completionTokens = document.getElementById("completion-tokens")
        let newPromptTokens = parseInt(promptTokens.innerText) + parseInt(data.prompt_tokens)
        let newCompletionTokens = parseInt(completionTokens.innerText) + parseInt(data.comp_tokens)
        if (newCompletionTokens == undefined || newPromptTokens == undefined) {
            createToast(data.error_daily_tokens)
        } else {
            promptTokens.innerText = newPromptTokens
            completionTokens.innerText = newCompletionTokens
            createToast(`PROMPT TOKENS: ${data.prompt_tokens} - COMPLETION TOKENS: ${data.comp_tokens}`)
        }
    } else {
        createToast(data.error)
    }
        
}

/**
 * Method to prepare the prompts for the chatbot
 */
const preparePrompts = () => {
    if (timestamp == "0"){
        const base_prompt = document.getElementById("base-prompt")
        let traitsPrompt = ""
        const message = document.getElementById("message")
        const traits = document.getElementsByClassName("btn-trait")
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
        return formData
    } else {
        const message = document.getElementById("message")
        const formData = new FormData()
        formData.append("message", message.value)
        return formData
    }
}

/**
 * Method with timeout to be nested in a loop to chck for the backup server status
 */
const checkBackupServer = async () => {
    setTimeout(async function(){
        const url = window.location.pathname.replace("/playground", "/backup_server_status")
        const response = await fetch (url, {
            method: "GET"
        })
        const data = await response.json()
        console.log(data.backup_server_up)
        if (data.backup_server_up) {
            backupServerUp = "True"
            sendButton.removeAttribute("disabled")
            const alertSpan = document.getElementById("alert-span")
            alertSpan.innerText = "Service will be slower and assistant not customizable, sorry for the incovenience."

        }
        console.log(data.backup_server_up)
    }, 10000)
}

if (backupServerUp != "True"){
    for (let i = 0; i < 50; i++) {
        checkBackupServer()
        if (backupServerUp){
            break
        }
    }
}
