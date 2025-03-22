const tokensUsageSelector = document.getElementById("tokens-select")

/**
 * Method to get a given tokens
 * @param {string} url 
 */
const getTokens = async (url) => {
    const response = await fetch(url)
    const data = await response.json()
    if (data.status == 200 && data.message != "do nothing") {
        showUsage(data.message)
    } else if (data.status == 200 && data.message == "do nothing") {
        showUsage({"prompt_tokens": "", "comp_tokens": ""})
    } else {
        createToast(data.error)
    }
}

/**
 * Method to show the retrieved token usage
 * @param {*} traits 
 */
const showUsage = (usage) => {
    const promptTokens = document.getElementById("staticPromptTokensUsage")
    const compTokens = document.getElementById("staticCompTokensUsage")
    promptTokens.value = usage.prompt_tokens
    compTokens.value = usage.comp_tokens
}

tokensUsageSelector.addEventListener("change", event => {
    const tokensUsageId = $(event.target).val()
    const url = `${$(event.target).attr("data-url")}${tokensUsageId}`
    getTokens(url)
})

/**
 * Method to delete an account
 * @param {html element} element 
 */
const deleteAccount = async (element) => {
    const url = element.getAttribute("data-delete-url")
    const deleteAccountUrl = window.location.pathname.replace("/profile", url)
    window.location.href = deleteAccountUrl
}

const deleteConfirmation = document.getElementById("deleteConfirmation")
const deleteConfirmationButton = document.getElementById("delete-confirmation")
deleteConfirmationButton.addEventListener("click", event => {
    deleteAccount(event.target)
})
deleteConfirmation.addEventListener("keyup", event => {
    const input = event.target
    if (input.value == "Delete my account") {
        deleteConfirmationButton.removeAttribute("disabled")
    } else {
        if (!input.hasAttribute("disabled")) {
            deleteConfirmationButton.setAttribute("disabled", true)
        }
    }
})