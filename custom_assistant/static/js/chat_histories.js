
const deleteModal = document.getElementById('delete-modal')
const deleteConfirmationButton = document.getElementById("delete-confirmation")

if (deleteModal) {
    deleteModal.addEventListener('show.bs.modal', event => {
        // Button that triggered the modal
        const button = event.relatedTarget
        // Extract info from data-bs-* attributes
        const url = button.getAttribute('data-bs-url')
        const name = button.getAttribute('data-bs-name')
        // Update the modal's content.
        const nameSpan = document.getElementById('name')
        nameSpan.innerText = name
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