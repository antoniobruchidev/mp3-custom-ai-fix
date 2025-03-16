const saveTraitButton = document.getElementById("save-trait")

/**
 * Method to create a button with the values of the trait in a popover
 * @param {string} trait 
 * @param {integer} value 
 * @param {string} reasonWhy 
 * @returns 
 */
const createButtonWithPopover = (trait, value, reasonWhy) => {
    const button = document.createElement("button")
    button.classList.add("btn", "btn-lg", "btn-trait")
    button.setAttribute("data-bs-toggle", "popover")
    button.setAttribute("data-bs-title", `${trait.toUpperCase()}: ${value}`)
    button.setAttribute("data-bs-content", reasonWhy)
    button.setAttribute("data-bs-placement", "bottom")
    button.setAttribute("data-bs-custom-class", "btn-popover")
    button.innerText = trait.toUpperCase()
    return button
}

/**
 * Method to enable the popovers present
 */
const updatePopovers = () => {
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
}

/**
 * Method to save a character trait from the given inputs
 */
const saveTrait = () => {
    const trait = document.getElementById("trait")
    const value = document.getElementById("value")
    const reasonWhy = document.getElementById("reason-why")
    const button = createButtonWithPopover(trait.value, value.value, reasonWhy.value)
    const traitsContainer = document.getElementById("traits-container")
    traitsContainer.appendChild(button)
    updatePopovers()
    trait.value = ""
    value.value = 5
    reasonWhy.value = ""
    const closeTraitButton = document.getElementById("close-trait")
    closeTraitButton.click()
}

// Event listener to save the trait
saveTraitButton.addEventListener("click", saveTrait)

/**
 * Method to show the bot answer
 * @param {string} answer 
 * @returns {string} the card to be shown as innerHtml
 */
const showAnswer = (answer) => {
    return `
<div class="card">
    <div class="card-body" style="background-color: white;">
        ${answer}
    </div>
</div>
`
}

/**
 * Method to clear the traits
 */
const clearTraits = () => {
    const traitsContainer = document.getElementById("traits-container")
    traitsContainer.innerHTML = ""
}

/**
 * Method to call the chatbot
 */
const chat = async () => {
    const base_prompt = document.getElementById("base-prompt")
    let traitsPrompt = ""
    const message = document.getElementById("message")
    const traits = document.getElementsByClassName("btn-trait")
    if (traits.length > 0) {
        for (let i=0; i < traits.length; i++) {
            console.log(traits[i])
            let title = traits[i].getAttribute("data-bs-title")
            let reasonWhy = traits[i].getAttribute("data-bs-content")
            traitsPrompt += `${title} \n${reasonWhy}\n\n`
        }
    }
    const url = window.location.pathname.replace("/playground", "/chat")
    const formData = new FormData()
    formData.append("base-prompt", base_prompt.value)
    formData.append("traits", traitsPrompt)
    formData.append("message", message.value)
    const response = await fetch(url, {method:"POST", body: formData})
    const data = await response.json()
    if (data.status == 200) {
        const chatContainer = document.getElementById("answer-container")
        chatContainer.innerHTML = createAnswer(data.answer)
        console.log(data.answer)
        createToast(`prompt tokens: {${data.prompt_tokens} completion tokens: ${data.comp_tokens}}`)
    }
    else {
        createToast(data.error)
    }
}

const sendButton = document.getElementById("send-message")

// add event listener to the send message button
sendButton.addEventListener("click", chat)

const clearTraitsButton = document.getElementById("clear")

// add event listener to the clear traits button
clearTraitsButton.addEventListener("click", clearTraits)
